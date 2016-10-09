import { NgModule, Component, Input, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Observable } from 'rxjs/Rx';

import { ILivingDocumentation, IFeatures, IResult } from '../../domain-model';
import { ILivingDocumentationService } from '../living-documentation-service';

import { TagList } from '../tag-list/tag-list';

interface IStatistics {
    passed: number;
    pending: number;
    failed: number;
    manual: number;
    total: number;
}

@Component({
    selector: 'statistics',
    templateUrl: 'components/dashboard/statistics.html'
})
class Statistics {
    @Input() name: string;
    @Input() statistics: IStatistics;
}

@Component({
    selector: 'documentation-dashboard',
    templateUrl: 'components/dashboard/documentation-dashboard.html'
})
class DocumentationDashboard implements OnInit {
    @Input() documentation: ILivingDocumentation;
    iterationFeatures = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    iterationScenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    features = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    scenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };

    private static isIteration(item: { Tags: string[]; }): boolean {
        return _.indexOf(item.Tags, '@iteration') !== -1;
    }

    private static processFeatures(
        features: IFeatures,
        includeItem: (item: { Tags: string[]; }) => boolean,
        featuresStatistics: IStatistics,
        scenariosStatistics: IStatistics): void {
        _.each(features, f => {
            let isFeatureIncluded = includeItem(f.Feature);
            let includedScenarios = _.filter(f.Feature.FeatureElements, s => isFeatureIncluded || includeItem(s));
            isFeatureIncluded = isFeatureIncluded || _.any(includedScenarios);
            if (isFeatureIncluded) {
                DocumentationDashboard.updateStatistics(f.Feature.Result, f.isManual, featuresStatistics);
            }

            _.each(
                includedScenarios,
                s => DocumentationDashboard.updateStatistics(s.Result, s.isManual, scenariosStatistics));
        });
    }

    private static updateStatistics(result: IResult, isManual: boolean, statistics: IStatistics): void {
        ++statistics.total;
        if (isManual) {
            ++statistics.manual;
            return;
        }

        if (!result.WasExecuted) {
            ++statistics.pending;
            return;
        }

        if (!result.WasSuccessful) {
            ++statistics.failed;
            return;
        }

        ++statistics.passed;
    }

    ngOnInit(): void {
        DocumentationDashboard.processFeatures(
            this.documentation.features,
            DocumentationDashboard.isIteration,
            this.iterationFeatures,
            this.iterationScenarios);
        DocumentationDashboard.processFeatures(
            this.documentation.features, _ => true, this.features, this.scenarios);
    }
}

@Component({
    selector: 'dashboard',
    templateUrl: 'components/dashboard/dashboard.html'
})
export class Dashboard {
    documentationList: Observable<ILivingDocumentation[]>;

    constructor(
        @Inject('livingDocumentationService') livingDocumentationService: ILivingDocumentationService
    ) {
        this.documentationList = livingDocumentationService.documentationListObservable;
    }
}

@NgModule({
    declarations: [
        Statistics,
        DocumentationDashboard,
        TagList,
        Dashboard
    ],
    exports: [Dashboard],
    imports: [CommonModule, RouterModule]
})
export class DashboardModule { }
