import { Component, Input, Inject } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { ILivingDocumentationService } from '../living-documentation-service';
import { ILivingDocumentation } from '../../domain-model';

@Component({
    directives: [ROUTER_DIRECTIVES],
    selector: 'tag-list',
    templateUrl: 'components/tag-list/tag-list.html'
})
export class TagList {
    @Input() documentation: ILivingDocumentation;

    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
    ) { }

    makeLink(tag: string): any[] {
        return ['/Dashboard', { search: encodeURIComponent(tag) }];
    }

    // The goSearch handler is provided because search won't be correctly initiated by a router link.
    goSearch(tag: string): void {
        this.livingDocService.search(tag);
    }

    get tags(): string[] {
        return _.sortBy(
            _.uniq(
                _.flatten(_.map(
                    this.documentation.features,
                    f => f.Feature.Tags.concat(
                        f.Feature.Background ? f.Feature.Background.Tags : [],
                        _.flatten(f.Feature.FeatureElements.map(fe => fe.Tags))
                    )
                ))
            ),
            _.identity
        );
    }
}
