/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />

'use strict';

module livingDocumentation {
    export interface ILivingDocumentationService {
        loading: boolean;

        error: string;

        ready: boolean;

        resolve: ng.IPromise<ILivingDocumentationService>;

        documentationList: ILivingDocumentation[];

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        startInitialization(): void;
    }

    const TIMEOUT = 200;

    class LivingDocumentationService implements ILivingDocumentationService {
        private deferred: ng.IDeferred<ILivingDocumentationService>;

        loading: boolean;

        error: string;

        ready: boolean;

        resolve: ng.IPromise<ILivingDocumentationService>;

        documentationList: ILivingDocumentation[] = [];

        onStartProcessing: () => void;

        onStopProcessing: () => void;

        static $inject: string[] = ['livingDocumentationServer', '$q', '$timeout'];

        constructor(
            private livingDocumentationServer: ILivingDocumentationServer,
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService) {
            this.loading = true;
            this.deferred = $q.defer<ILivingDocumentationService>();
            this.resolve = this.deferred.promise;
        }

        startInitialization(): void {
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }

            this.deferred.promise.finally(() => this.onStopProcessing());

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

        private onError(err: any) {
            console.error(err);
            this.error = err;
            this.loading = false;
        }

        private initialize() {
            this.loading = false;
            this.ready = true;
        }
    }

    angular.module('livingDocumentation.services', ['livingDocumentation.services.server'])
        .value('version', '0.1')
        .service('livingDocumentationService', LivingDocumentationService);
}
