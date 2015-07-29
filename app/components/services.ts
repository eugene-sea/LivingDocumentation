/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />
/// <reference path="search-service.ts" />

'use strict';

module livingDocumentation {
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

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        startInitialization(): void;

        search(searchText: string): void;
    }

    const TIMEOUT = 200;

    class LivingDocumentationService implements ILivingDocumentationService {
        private deferred: ng.IDeferred<ILivingDocumentationService>;

        loading: boolean;

        error: string;

        ready: boolean;

        resolve: ng.IPromise<ILivingDocumentationService>;

        documentationList: ILivingDocumentation[] = [];

        filteredDocumentationList: ILivingDocumentation[] = [];

        searchContext: ISearchContext = null;

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        static $inject: string[] = ['livingDocumentationServer', '$q', '$timeout', 'search', '$location'];

        constructor(
            private livingDocumentationServer: ILivingDocumentationServer,
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private searchService: ISearchService,
            private $location: ng.ILocationService) {
            this.loading = true;
            this.deferred = $q.defer<ILivingDocumentationService>();
            this.resolve = this.deferred.promise;
        }

        get searchText(): string { return this.$location.search().search; }

        get urlSearchPart() {
            return !this.searchText ? '' : `?search=${ this.searchText }`;
        }

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
                [this.filteredDocumentationList, this.searchContext] = [this.documentationList, null];
                return;
            }

            var res = this.searchService.search(searchText, this.documentationList);
            [this.filteredDocumentationList, this.searchContext] = [res.documentationList, res.searchContext];
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
    }

    angular.module('livingDocumentation.services', [
        'livingDocumentation.services.server', 'livingDocumentation.services.search'
    ])
        .value('version', '0.1')
        .service('livingDocumentationService', LivingDocumentationService);
}
