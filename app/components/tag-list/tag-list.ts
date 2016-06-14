import { Component, Input, Inject } from '@angular/core';
import { ROUTER_DIRECTIVES, Router } from '@angular/router-deprecated';

import { ILivingDocumentationService } from '../living-documentation-service';
import { ILivingDocumentation, IFeatures, IResult } from '../../domain-model';

@Component({
    directives: [ROUTER_DIRECTIVES],
    selector: 'tag-list',
    templateUrl: 'components/tag-list/tag-list.html'
})
export class TagList{
    @Input() documentation: ILivingDocumentation;
    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
    ) { }

    makeLink(tag: string): any[] {
        return ['Dashboard', { search: encodeURIComponent(tag) }];
    }

    // the goSearch handler is provided because search won't be correctly initiated by a router link. 
    goSearch(tag: string): void {
        this.livingDocService.search(tag);
    }

    get tags(): string[] {
        return _.uniq(
            _.map(
                this.documentation.features,
                f => {
                    let arr = f.Feature.Tags.concat(f.Feature.Background ? f.Feature.Background.Tags : []);
                    f.Feature.FeatureElements.forEach(fe => arr = arr.concat(fe.Tags));
                    return arr;
                }
            )
            .reduce((acc, tags) => acc.concat(tags), [])
        )
        .sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    }
}