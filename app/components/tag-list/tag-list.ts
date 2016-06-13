import { Component, Input, Inject } from '@angular/core';
import { ROUTER_DIRECTIVES, Router } from '@angular/router-deprecated';
import { ILivingDocumentationService } from '../living-documentation-service';

@Component({
    directives: [ROUTER_DIRECTIVES],
    selector: 'tag-list',
    templateUrl: 'components/tag-list/tag-list.html'
})
export class TagList{
    @Input() tags: string[];
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
}