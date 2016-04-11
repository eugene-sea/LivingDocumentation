import { Component, Inject } from 'angular2/core';
import { RouteConfig, RouteParams, Router, ROUTER_DIRECTIVES } from 'angular2/router';
import { FORM_DIRECTIVES, Control } from 'angular2/common';
import { Observable } from 'rxjs/Rx';
import { DROPDOWN_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { ILivingDocumentationService, DocumentationFilter } from '../services';
import { DocumentationList } from '../documentation_list/documentation-list';
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
    constructor(public params: RouteParams) { ; }
}

@RouteConfig([
    { component: Dashboard, name: 'Dashboard', path: '/dashboard' },
    { component: FeatureContainer, name: 'Feature', path: '/feature/:documentationCode/:featureCode' },
    { path: '/**', redirectTo: ['Dashboard'] }
])
@Component({
    directives: [ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, FORM_DIRECTIVES, DocumentationList],
    selector: 'living-documentation-app',
    templateUrl: 'components/living_documentation_app/living-documentation-app.tpl.html'
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
                    this.showOnly(null, true);
                } else {
                    this.search(this.searchText);
                }
            }
        });

        this.searchControl.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe((s: string) => this.search(s));

        this.lastUpdatedOn = livingDocService.documentationListObservable
            .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
            .filter(d => d != null)
            .map(d => d.lastUpdatedOn);

        router.subscribe(() => this.searchText = livingDocService.searchText || '');
        livingDocService.startInitialization();
    }

    get error() { return this.livingDocService.error; }
    get ready() { return this.livingDocService.ready; }

    get isClearSearchEnabled() {
        return !!this.livingDocService.searchText || this.filter != null;
    }

    get filter() { return this.livingDocService.filter; }

    clearSearch(): void {
        this.livingDocService.search(null);
    }

    clearFilter(): void {
        this.livingDocService.showOnly(null);
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        this.livingDocService.showOnly(filter, initialize);
    }

    addQueryParameters(params: any): any {
        return this.livingDocService.addQueryParameters(params);
    }

    private search(text: string): void {
        this.livingDocService.search(text);
    }
}
