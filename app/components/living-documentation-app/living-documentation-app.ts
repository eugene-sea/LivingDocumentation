import { Component, Inject } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';
import { FORM_DIRECTIVES, Control } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { DROPDOWN_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { ILivingDocumentationService, DocumentationFilter } from '../living-documentation-service';
import { DocumentationList } from '../documentation-list/documentation-list';

@Component({
    directives: [ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, FORM_DIRECTIVES, DocumentationList],
    selector: 'living-documentation-app',
    templateUrl: 'components/living-documentation-app/living-documentation-app.html'
})
export class LivingDocumentationApp {
    searchText: string = '';
    searchControl = new Control();
    lastUpdatedOn: Observable<Date>;

    documentationFilter = DocumentationFilter;

    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService,
        @Inject('version') public appVersion: string
    ) {
        livingDocService.loading.subscribe(isLoading => { /* TODO: */ });

        this.searchControl.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe((s: string) => s !== livingDocService.searchText && this.searchCore(s));

        this.lastUpdatedOn = livingDocService.documentationListObservable
            .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
            .filter(d => d != null)
            .map(d => d.lastUpdatedOn);

        livingDocService.searchTextObservable.subscribe(s => this.searchText = s || '');
        livingDocService.startInitialization();
    }

    get error() { return this.livingDocService.error; }

    get isClearSearchEnabled() {
        return !!this.livingDocService.searchText || this.filter != null;
    }

    get filter() { return this.livingDocService.filter; }

    search() {
        this.searchCore(this.searchText);
    }

    clearSearch(): void {
        this.livingDocService.clearSearch();
    }

    clearFilter(): void {
        this.livingDocService.showOnly(null);
    }

    showOnly(filter: DocumentationFilter): void {
        this.livingDocService.showOnly(filter);
    }

    private searchCore(text: string): void {
        this.livingDocService.search(text);
    }
}
