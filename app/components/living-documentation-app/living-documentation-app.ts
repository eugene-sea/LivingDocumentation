import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Rx';

import { ILivingDocumentationService, DocumentationFilter } from '../living-documentation-service';

@Component({
    selector: 'living-documentation-app',
    templateUrl: 'components/living-documentation-app/living-documentation-app.html'
})
export class LivingDocumentationApp {
    searchControl = new FormControl();
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

        livingDocService.searchTextObservable.subscribe(
            s => this.searchControl.setValue(s || '', { emitEvent: false })
        );
        livingDocService.startInitialization();
    }

    get error() { return this.livingDocService.error; }

    get isClearSearchEnabled() {
        return !!this.livingDocService.searchText || this.filter != null;
    }

    get filter() { return this.livingDocService.filter; }

    search() {
        this.searchCore(this.searchControl.value);
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
