import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router-deprecated';
import { URLSearchParams } from '@angular/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

import { ILivingDocumentation } from '../domain-model';
import { ILivingDocumentationServer } from './living-documentation-server';
import { ISearchService, ISearchContext } from './search-service';

export enum DocumentationFilter {
    InProgress,
    Pending,
    Failing,
    Manual
}

export interface ILivingDocumentationService {
    loading: Observable<boolean>;

    error: string;

    documentationListObservable: Observable<ILivingDocumentation[]>;

    filteredDocumentationListObservable: Observable<ILivingDocumentation[]>;

    searchContext: ISearchContext;

    searchText: string;

    filter: DocumentationFilter;

    startInitialization(): void;

    search(searchText: string): void;

    clearSearch(): void;

    showOnly(filter: DocumentationFilter): void;

    addQueryParameters(params?: any): any;
}

@Injectable()
export default class LivingDocumentationService implements ILivingDocumentationService {
    loading = new BehaviorSubject(true);

    error: string;

    documentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);

    filteredDocumentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);
    private get filteredDocumentationList(): ILivingDocumentation[] {
        return this.filteredDocumentationListObservable.value;
    }

    private set filteredDocumentationList(value: ILivingDocumentation[]) {
        this.filteredDocumentationListObservable.next(value);
    }

    searchContext: ISearchContext = null;

    private currentSearchText = '';

    constructor(
        @Inject('livingDocumentationServer') private livingDocumentationServer: ILivingDocumentationServer,
        @Inject('search') private searchService: ISearchService,
        private router: Router
    ) { }

    get searchText(): string {
        return this.router.currentInstruction &&
            decodeURIComponent(this.router.currentInstruction.component.params['search'] || '');
    }

    get filter(): DocumentationFilter { return this.filterRaw && (<any>DocumentationFilter)[this.filterRaw]; }

    private get filterRaw(): string {
        return this.router.currentInstruction && this.router.currentInstruction.component.params['showOnly'];
    }

    startInitialization(): void {
        this.livingDocumentationServer.getResourceDefinitions()
            .concatMap(resources => Observable.zip(..._.map(resources, r => this.livingDocumentationServer.get(r))))
            .subscribe(
            (docs: ILivingDocumentation[]) => {
                this.documentationListObservable.next(docs);
                this.initialize();
            },
            err => this.onError(err)
            );
    }

    search(searchText: string): void {
        this.updateQueryParameterAndNavigate('search', searchText);
    }

    clearSearch(): void {
        this.clearSearchCore();
        console.log('Clear search:', this.router.currentInstruction.urlPath);
        this.router.navigateByUrl(this.router.currentInstruction.urlPath);
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        this.updateQueryParameterAndNavigate('showOnly', DocumentationFilter[filter]);
    }

    addQueryParameters(params?: any): any {
        params = params || {};
        if (this.searchText) {
            params.search = encodeURIComponent(this.searchText);
        }

        if (this.filterRaw) {
            params.showOnly = this.filterRaw;
        }

        return params;
    }

    private onError(err: any) {
        console.error(err);
        this.error = err;
        this.loading.next(false);
    }

    private initialize() {
        this.filteredDocumentationList = this.documentationListObservable.value;
        this.loading.next(false);
    }

    private updateQueryParameterAndNavigate(param: string, paramValue: string) {
        const query = this.router.currentInstruction.toUrlQuery();
        const params = new URLSearchParams(query && query.slice(1));
        if (paramValue) {
            params.set(param, encodeURIComponent(paramValue));
        } else {
            params.delete(param);
        }

        const paramsStr = params.toString();
        const url = `/${this.router.currentInstruction.urlPath}${!paramsStr ? '' : '?' + paramsStr}`;
        console.log('Update query parameter:', url);
        this.router.navigateByUrl(url).then(() => this.searchCore());
    }

    private clearSearchCore() {
        [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
            [this.documentationListObservable.value, null, null];
    }

    private searchCore() {
        let searchText: string;

        switch (this.filter) {
            case DocumentationFilter.InProgress:
                searchText = '@iteration ';
                break;
            case DocumentationFilter.Pending:
                searchText = '@pending ';
                break;
            case DocumentationFilter.Failing:
                searchText = '@failing ';
                break;
            case DocumentationFilter.Manual:
                searchText = '@manual ';
                break;
            default:
                searchText = '';
        }

        searchText += this.searchText || '';

        if (!searchText) {
            this.clearSearchCore();
        } else if (searchText !== this.currentSearchText) {
            const res = this.searchService.search(searchText, this.documentationListObservable.value);
            [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [res.documentationList, res.searchContext, searchText];
        }

        let [documentationCode, featureCode] = [
            this.router.currentInstruction.component.params['documentationCode'],
            this.router.currentInstruction.component.params['featureCode']
        ];

        if (documentationCode && featureCode) {
            let documentation = _.find(
                this.filteredDocumentationList, doc => doc.definition.code === documentationCode);
            if (!documentation) {
                documentationCode = null;
            } else {
                let feature = documentation.features[featureCode];
                if (!feature) {
                    featureCode = null;
                }
            }
        }

        if (searchText && (!documentationCode || !featureCode)) {
            let documentation = _.find(this.filteredDocumentationList, d => _.any(d.features));
            if (documentation) {
                [documentationCode, featureCode] =
                    [documentation.definition.code, _.find(documentation.features, _ => true).code];
            }
        }

        let linkParams = !documentationCode || !featureCode
            ? ['/Dashboard', this.addQueryParameters()]
            : ['/Feature', this.addQueryParameters({
                documentationCode: documentationCode,
                featureCode: featureCode
            })];

        if (!this.router.isRouteActive(this.router.generate(linkParams))) {
            console.log(linkParams);
            this.router.navigate(linkParams);
        }
    }
}
