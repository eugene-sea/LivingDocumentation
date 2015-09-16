/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />
/// <reference path="search-service.ts" />

'use strict';

module livingDocumentation {
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

        resolve: ng.IPromise<ILivingDocumentationService>;

        documentationList: ILivingDocumentation[];

        filteredDocumentationList: ILivingDocumentation[];

        searchContext: ISearchContext;

        searchText: string;

        urlSearchPart: string;

        filter: DocumentationFilter;

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        startInitialization(): void;

        search(searchText: string): void;

        showOnly(filter: DocumentationFilter, initialize?: boolean): void;
    }

    const TIMEOUT = 200;

    class LivingDocumentationService implements ILivingDocumentationService {
        private deferred: ng.IDeferred<ILivingDocumentationService>;
        private currentSearchText = '';

        loading: boolean;

        error: string;

        ready: boolean;

        resolve: ng.IPromise<ILivingDocumentationService>;

        documentationList: ILivingDocumentation[] = [];

        filteredDocumentationList: ILivingDocumentation[] = [];

        searchContext: ISearchContext = null;

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        static $inject: string[] = [
            'livingDocumentationServer', '$q', '$timeout', 'search', '$location', '$route'
        ];

        constructor(
            private livingDocumentationServer: ILivingDocumentationServer,
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private searchService: ISearchService,
            private $location: ng.ILocationService,
            private $route: angular.route.IRouteService) {
            this.loading = true;
            this.deferred = $q.defer<ILivingDocumentationService>();
            this.resolve = this.deferred.promise;
        }

        get searchText(): string { return this.$location.search().search; }

        get urlSearchPart() {
            return `${ !this.searchText ? '' : `?search=${ encodeURIComponent(this.searchText || '') }` }${ this.filter == null ? '' : `${ this.searchText ? '&' : '?' }showOnly=${this.filterRaw}` }`;
        }

        get filter() { return !this.filterRaw ? null : (<any>DocumentationFilter)[this.filterRaw]; }

        private get filterRaw(): string { return this.$location.search().showOnly; }

        startInitialization(): void {
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }

            this.deferred.promise.finally(() => this.onStopProcessing()).catch(err => this.onError(err));

            this.livingDocumentationServer.getResourceDefinitions()
                .then(resources => this.$q.all(_.map(resources, r => this.livingDocumentationServer.get(r))))
                .then(
                    (docs: ILivingDocumentation[]) => {
                        this.documentationList = docs;
                        this.$timeout(
                            () => {
                                this.deferred.resolve(this);
                                this.initialize();
                            },
                            TIMEOUT);
                    },
                    err => this.$timeout(
                        () => {
                            this.deferred.reject(err);
                            this.onError(err);
                        },
                        TIMEOUT));
        }

        search(searchText: string): void {
            this.$location.search('search', searchText);

            if (!searchText) {
                this.$location.search('showOnly', null);
                [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [this.documentationList, null, null];
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

        private onError(err: any) {
            console.error(err);
            this.error = err;
            this.loading = false;
        }

        private initialize() {
            this.loading = false;
            this.ready = true;
            this.filteredDocumentationList = this.documentationList;
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
                let res = this.searchService.search(searchText, this.documentationList);
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

    angular.module('livingDocumentation.services', [
        'livingDocumentation.services.server', 'livingDocumentation.services.search'
    ])
        .value('version', '0.9')
        .service('livingDocumentationService', LivingDocumentationService);
}
