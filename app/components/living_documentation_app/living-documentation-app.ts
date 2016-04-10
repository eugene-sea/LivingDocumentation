import { Component, Inject } from 'angular2/core';
import { RouteConfig, RouteParams, Router, ROUTER_DIRECTIVES } from 'angular2/router';
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
    directives: [ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, DocumentationList],
    selector: 'living-documentation-app',
    templateUrl: 'components/living_documentation_app/living-documentation-app.tpl.html'
})
export class LivingDocumentationApp {
    searchText: string = '';
    lastUpdatedOn: Observable<Date>;

    documentationFilter = DocumentationFilter;

    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService,
        @Inject('version') public appVersion: string,
        router: Router
    ) {
        livingDocService.onStartProcessing = () => {
            // TODO:
        };

        let self = this;
        livingDocService.onStopProcessing = () => {
            if (self.isClearSearchEnabled) {
                if (!self.searchText) {
                    self.showOnly(null, true);
                } else {
                    self.search();
                }
            }
        };

        this.lastUpdatedOn = this.livingDocService.documentationListObservable
            .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
            .filter(d => d != null)
            .map(d => d.lastUpdatedOn);

        router.subscribe(() => this.searchText = this.livingDocService.searchText || '');
        livingDocService.startInitialization();
    }

    get loading() { return this.livingDocService.loading; }
    set loading(value) { ; }

    get error() { return this.livingDocService.error; }
    get ready() { return this.livingDocService.ready; }

    get isSearchEnabled() { return !!this.searchText.trim(); }
    get isClearSearchEnabled() {
        return !!this.livingDocService.searchText || this.filter != null;
    }

    get filter() { return this.livingDocService.filter; }

    search(): void {
        this.livingDocService.search(this.searchText);
    }

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
}
