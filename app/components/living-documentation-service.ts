import { Injectable, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

    searchTextObservable: Observable<string>;

    filter: DocumentationFilter;

    startInitialization(): void;

    search(searchText: string): void;

    clearSearch(): void;

    showOnly(filter: DocumentationFilter): void;
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

    searchText: string;

    searchTextObservable: Observable<string>;

    private currentSearchText = '';

    private filterRaw: string;

    constructor(
        @Inject('livingDocumentationServer') private livingDocumentationServer: ILivingDocumentationServer,
        @Inject('search') private searchService: ISearchService,
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) {
        const getSearchText = (p: { [key: string]: any }) => p['search'] && decodeURIComponent(p['search']);
        this.searchTextObservable = activatedRoute.queryParams.map(getSearchText);
        activatedRoute.queryParams.subscribe(p => {
            this.searchText = getSearchText(p);
            this.filterRaw = p['showOnly'];
            const renavigate = !!this.searchText || !!this.filter;
            if (!this.loading.value) {
                this.searchCore(renavigate);
            } else {
                this.loading.skip(1).first().subscribe(() => this.searchCore(renavigate));
            }
        });
    }

    get filter(): DocumentationFilter { return this.filterRaw && (<any>DocumentationFilter)[this.filterRaw]; }

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
        console.log('Clear search:', this.router.url);
        const urlTree = this.router.parseUrl(this.router.url);
        urlTree.queryParams = {};
        this.router.navigateByUrl(urlTree);
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        this.updateQueryParameterAndNavigate('showOnly', DocumentationFilter[filter]);
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
        const urlTree = this.router.parseUrl(this.router.url);
        const params = urlTree.queryParams;
        if (!paramValue) {
            delete params[param];
        } else {
            params[param] = encodeURIComponent(paramValue);
        }

        const url = this.router.serializeUrl(urlTree);
        console.log('Update query parameter:', url);
        this.router.navigateByUrl(url);
    }

    private clearSearchCore() {
        [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
            [this.documentationListObservable.value, null, null];
    }

    private searchCore(renavigate: boolean) {
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

        if (!renavigate) {
            console.log('No renavigate:', this.router.url);
            return;
        }

        const state = this.router.routerState;
        const params = (state.root.firstChild.snapshot && state.root.firstChild.snapshot.params) || {};
        let [documentationCode, featureCode] = [params['documentationCode'], params['featureCode']];

        if (documentationCode && featureCode) {
            const documentation = _.find(
                this.filteredDocumentationList, doc => doc.definition.code === documentationCode
            );
            if (!documentation) {
                documentationCode = null;
            } else {
                const feature = documentation.features[featureCode];
                if (!feature) {
                    featureCode = null;
                }
            }
        }

        if (searchText && (!documentationCode || !featureCode)) {
            const documentation = _.find(this.filteredDocumentationList, d => _.any(d.features));
            if (documentation) {
                [documentationCode, featureCode] =
                    [documentation.definition.code, _.find(documentation.features, _ => true).code];
            }
        }

        const linkParams = !documentationCode || !featureCode
            ? ['/dashboard']
            : ['/feature', documentationCode, featureCode];

        const queryParams: any = {};
        if (this.searchText) {
            queryParams.search = encodeURIComponent(this.searchText);
        }

        if (this.filterRaw) {
            queryParams.showOnly = this.filterRaw;
        }

        console.log('After search navigate:', linkParams, queryParams);
        this.router.navigate(linkParams, { queryParams: queryParams });
    }
}
