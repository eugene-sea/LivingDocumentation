import { Injectable, Inject } from 'angular2/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

import { adapter } from './adapter';

import { ILivingDocumentation } from '../domain-model';
import { ILivingDocumentationServer } from './living-documentation-server';
import './living-documentation-server';
import { ISearchService, ISearchContext } from './search-service';
import './search-service';

export enum DocumentationFilter {
    InProgress,
    Pending,
    Failing,
    Manual
}

export interface ILivingDocumentationService {
    loading: boolean;

    error: string;

    ready: boolean;

    documentationListObservable: Observable<ILivingDocumentation[]>;

    filteredDocumentationListObservable: Observable<ILivingDocumentation[]>;

    searchContext: ISearchContext;

    searchText: string;

    urlSearchPart: string;

    filter: DocumentationFilter;

    onStartProcessing: () => void;

    onStopProcessing: () => void;

    startInitialization(): void;

    search(searchText: string): void;

    showOnly(filter: DocumentationFilter, initialize?: boolean): void;

    isUrlActive(url: string): boolean;
}

const TIMEOUT = 200;

adapter.upgradeNg1Provider('$location');
adapter.upgradeNg1Provider('$route');

@Injectable()
class LivingDocumentationService implements ILivingDocumentationService {
    loading: boolean;

    error: string;

    ready: boolean;

    documentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);

    filteredDocumentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);
    private get filteredDocumentationList(): ILivingDocumentation[] {
        return this.filteredDocumentationListObservable.value;
    }

    private set filteredDocumentationList(value: ILivingDocumentation[]) {
        this.filteredDocumentationListObservable.next(value);
    }

    searchContext: ISearchContext = null;

    onStartProcessing: () => void;

    onStopProcessing: () => void;

    private currentSearchText = '';

    constructor(
        @Inject('livingDocumentationServer') private livingDocumentationServer: ILivingDocumentationServer,
        @Inject('search') private searchService: ISearchService,
        @Inject('$location') private $location: ng.ILocationService,
        @Inject('$route') private $route: angular.route.IRouteService
    ) {
        this.loading = true;
    }

    get searchText(): string { return this.$location.search().search; }

    get urlSearchPart() {
        return (!this.searchText ? '' : `?search=${encodeURIComponent(this.searchText || '')}`) +
            (this.filter == null ? '' : `${this.searchText ? '&' : '?'}showOnly=${this.filterRaw}`);
    }

    get filter(): DocumentationFilter { return !this.filterRaw ? null : (<any>DocumentationFilter)[this.filterRaw]; }

    private get filterRaw(): string { return this.$location.search().showOnly; }

    startInitialization(): void {
        if (this.onStartProcessing) {
            this.onStartProcessing();
        }

        this.livingDocumentationServer.getResourceDefinitions()
            .concatMap(resources => Observable.zip(..._.map(resources, r => this.livingDocumentationServer.get(r))))
            .delay(TIMEOUT)
            .subscribe(
            (docs: ILivingDocumentation[]) => {
                this.documentationListObservable.next(docs);
                this.initialize();
            },
            err => this.onError(err),
            () => this.onStopProcessing()
            );
    }

    search(searchText: string): void {
        this.$location.search('search', searchText);

        if (!searchText) {
            this.$location.search('showOnly', null);
            [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [this.documentationListObservable.value, null, null];
            return;
        }

        this.searchCore();
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        if (!initialize) {
            this.$location.search('showOnly', DocumentationFilter[filter]);
        }

        this.searchCore();
    }

    isUrlActive(url: string): boolean {
        const indexOf = this.$location.path().indexOf(url);
        return indexOf >= 0 && (indexOf + url.length === this.$location.path().length);
    }

    private onError(err: any) {
        console.error(err);
        this.error = err;
        this.loading = false;
    }

    private initialize() {
        this.loading = false;
        this.ready = true;
        this.filteredDocumentationList = this.documentationListObservable.value;
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

        if (searchText !== this.currentSearchText) {
            let res = this.searchService.search(searchText, this.documentationListObservable.value);
            [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [res.documentationList, res.searchContext, searchText];
        }

        let [documentationCode, featureCode] =
            !this.$route.current
                ? [null, null]
                : [
                    <string>this.$route.current.params['documentationCode'],
                    <string>this.$route.current.params['featureCode']
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

        if (!documentationCode || !featureCode) {
            let documentation = _.find(this.filteredDocumentationList, d => _.any(d.features));
            if (documentation) {
                [documentationCode, featureCode] =
                    [documentation.definition.code, _.find(documentation.features, _ => true).code];
            }
        }

        if (!documentationCode || !featureCode) {
            this.$location.path('/dashboard');
        } else {
            this.$location.path(`/feature/${documentationCode}/${featureCode}`);
        }
    }
}

adapter.addProvider(LivingDocumentationService);

angular.module('livingDocumentation.services', [
    'livingDocumentation.services.server', 'livingDocumentation.services.search'
])
    .value('version', '0.9')
    .factory('livingDocumentationService', adapter.downgradeNg2Provider(LivingDocumentationService));

adapter.upgradeNg1Provider('livingDocumentationService');
