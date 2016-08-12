import { Component, Input, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import { ILivingDocumentation, IFeature, IScenario, ITable, IResult } from '../../domain-model';
import { ILivingDocumentationService } from '../living-documentation-service';
import { format } from '../utils';
import {
    HighlightPipe, HighlightTagPipe, NewLinePipe, ScenarioOutlinePlaceholderPipe, WidenPipe, SafePipe
} from '../pipes';

@Component({
    pipes: [HighlightPipe, WidenPipe, ScenarioOutlinePlaceholderPipe, SafePipe],
    selector: 'feature-table',
    templateUrl: 'components/feature/table.html'
})
class Table {
    @Input() table: ITable;
    @Input() tests: string[];
}

@Component({
    pipes: [HighlightTagPipe],
    selector: 'tags',
    templateUrl: 'components/feature/tags.html'
})
class Tags implements OnInit {
    @Input() documentation: ILivingDocumentation;
    @Input() tags: string[];

    tagsWithIssueUrl: { issueUrl: string; tag: string; }[];

    ngOnInit(): void {
        this.tagsWithIssueUrl = this.tags.map(t => {
            return { issueUrl: this.getIssueTrackingUrl(t), tag: t };
        });
    }

    private getIssueTrackingUrl(tag: string): string {
        const match = new RegExp(this.documentation.definition.issueTrackingRegExp, 'i').exec(tag);
        return match === null ? null : format(this.documentation.definition.issueTrackingUrl, ...match);
    }
}

@Component({
    selector: 'status',
    templateUrl: 'components/feature/status.html'
})
class Status {
    @Input() isManual: boolean;
    @Input() status: IResult;
}

@Component({
    directives: [Status, Tags, Table],
    pipes: [HighlightPipe, NewLinePipe, ScenarioOutlinePlaceholderPipe, SafePipe],
    selector: 'scenario',
    templateUrl: 'components/feature/scenario.html'
})
class Scenario {
    @Input() documentation: ILivingDocumentation;
    @Input() scenario: IScenario;
    @Input() isBackground = false;
}

@Component({
    directives: [Status, Tags, Scenario],
    pipes: [HighlightPipe, NewLinePipe, SafePipe],
    selector: 'feature',
    templateUrl: 'components/feature/feature.html'
})
export class Feature implements OnInit {
    @Input() documentationCode: Observable<string>;
    @Input() featureCode: Observable<string>;
    feature: Observable<IFeature[]>;
    documentation: ILivingDocumentation;
    featureEditUrl: string;

    private featureInner: IFeature;

    constructor(
        @Inject('livingDocumentationService') private livingDocumentationService: ILivingDocumentationService
    ) { }

    ngOnInit(): void {
        let documentationCode: string;
        let featureCode: string;
        this.feature = Observable.combineLatest(
            this.livingDocumentationService.filteredDocumentationListObservable,
            this.documentationCode,
            this.featureCode
        )
            .map(a => {
                let list: ILivingDocumentation[];
                [list, documentationCode, featureCode] = a;
                return list;
            })
            .map(l => _.find(l, doc => doc.definition.code === documentationCode))
            .filter(d => d != null)
            .map(d => {
                this.documentation = d;
                this.featureInner = this.documentation.features[featureCode];

                if (!this.featureInner) {
                    return [];
                }

                if (this.documentation.definition.featureEditUrl) {
                    this.featureEditUrl = format(
                        this.documentation.definition.featureEditUrl,
                        this.featureInner.RelativeFolder.replace(/\\/g, '/')
                    );
                }

                return [this.featureInner];
            });
    }

    get isExpanded(): boolean { return this.featureInner && this.featureInner.isExpanded; }
    set isExpanded(value: boolean) {
        this.featureInner.isExpanded = value;
        _.each(this.featureInner.Feature.FeatureElements, s => s.isExpanded = value);
        if (this.featureInner.Feature.Background) {
            this.featureInner.Feature.Background.isExpanded = value;
        }
    }
}
