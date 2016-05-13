import { Component, Inject } from '@angular/core';
import { RouteConfig, RouteParams, Router, ROUTER_DIRECTIVES } from '@angular/router-deprecated';
import { FORM_DIRECTIVES, Control } from '@angular/common';
import { Observable, Subscription } from 'rxjs/Rx';
import { DROPDOWN_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { ILivingDocumentationService, DocumentationFilter } from '../living-documentation-service';
import { DocumentationList } from '../documentation-list/documentation-list';
import { Dashboard } from '../dashboard/dashboard';
import { Feature } from '../feature/feature';

@Component({
    directives: [Feature],
    selector: 'feature-container',
    template: `
        <feature [documentationCode]="params.get('documentationCode')" [featureCode]="params.get('featureCode')">
        </feature>
    `
})
class FeatureContainer {
    constructor(public params: RouteParams) { }
}

@RouteConfig([
    { component: Dashboard, name: 'Dashboard', path: '/dashboard' },
    { component: FeatureContainer, name: 'Feature', path: '/feature/:documentationCode/:featureCode' },
    { path: '/**', redirectTo: ['Dashboard'] }
])
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
        @Inject('version') public appVersion: string,
        router: Router
    ) {
        livingDocService.loading.subscribe(isLoading => {
            if (isLoading) {
                // TODO:
            } else if (this.isClearSearchEnabled) {
                if (!this.searchText) {
                    this.showOnly(this.filter);
                } else {
                    this.searchCore(this.searchText);
                }
            }
        });

        this.searchControl.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe((s: string) => this.searchCore(s));

        this.lastUpdatedOn = livingDocService.documentationListObservable
            .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
            .filter(d => d != null)
            .map(d => d.lastUpdatedOn);

        let subsription: Subscription;
        subsription = <any>router.subscribe(() => {
            this.searchText = livingDocService.searchText || '';
            subsription.unsubscribe();
        });
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

    addQueryParameters(params: any): any {
        return this.livingDocService.addQueryParameters(params);
    }

    private searchCore(text: string): void {
        this.livingDocService.search(text);
    }
}
