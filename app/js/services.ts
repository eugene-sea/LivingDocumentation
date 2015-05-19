/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="configuration.ts" />

'use strict';

module livingDocumentation {
    export interface ITable {
        HeaderRow: string[];
        DataRows: string[][];
    }

    export interface IStep {
        Keyword: string;
        Name: string;
        TableArgument?: ITable;
    }

    export interface IScenario {
        Name: string;
        Description: string;
        Steps: IStep[];
        Examples?: {
            Decription: string;
            TableArgument: ITable;
        };

        tests: string[];
    }

    export interface IFeature {
        code: string;

        RelativeFolder: string;
        Feature: {
            Name: string;
            Description: string;
            Tags: string[];
            Background?: IScenario;
            FeatureElements: IScenario[];
        };
    }

    interface IFeaturesSource {
        Features: IFeature[];
        Configuration: {
            GeneratedOn: Date;
        };
    }

    export interface IFeatures {
        [code: string]: IFeature;
    }

    export interface IFolder {
        name: string;
        children: IFolder[];
        features: IFeature[];
        isRoot?: boolean;
    }

    interface IScenarioTestSource {
        ScenarioName: string;
        Test: string;
    }

    interface IFeatureTestsSource {
        RelativeFolder: string;
        ScenariosTests: IScenarioTestSource[];
    }

    interface IFeaturesTestsSource {
        FeaturesTests: IFeatureTestsSource[];
    }

    export interface ILivingDocumentation {
        definition: ILivingDocumentationResourceDefinition;
        root: IFolder;
        features: IFeatures;
        lastUpdatedOn: Date;
    }

    interface ILivingDocumentationResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesSource>> {
    }

    class LivingDocumentationServer {
        private livingDocumentationResourceClass: ILivingDocumentationResourceClass;

        constructor($resource: ng.resource.IResourceService, private $q: ng.IQService) {
            this.livingDocumentationResourceClass = <ILivingDocumentationResourceClass>$resource(
                'data/:resource', null, { get: { method: 'GET' } });
        }

        public get(resource: ILivingDocumentationResourceDefinition): ng.IPromise<ILivingDocumentation> {
            var promiseFeatures = <ng.IPromise<IFeature[]>><any>this.livingDocumentationResourceClass.get(
                { resource: resource.featuresResource })['$promise'];

            var promiseTests: ng.IPromise<IFeatureTestsSource[]> = !resource.testsResources
                ? this.$q.when(null)
                : <ng.IPromise<IFeatureTestsSource[]>><any>this.livingDocumentationResourceClass.get(
                    { resource: resource.testsResources }
                    )['$promise'];

            return this.$q.all([promiseFeatures, promiseTests]).then(
                (arr: any[]) => LivingDocumentationServer.parseFeatures(
                    resource,
                    arr[0].Features,
                    arr[0].Configuration.GeneratedOn,
                    !arr[1] ? null : arr[1].FeaturesTests));
        }

        private static findSubfolderOrCreate(parent: IFolder, childName: string): IFolder {
            var res = _.find(parent.children, c => c.name === childName);
            if (!res) {
                res = {
                    name: childName,
                    children: [],
                    features: []
                };

                parent.children.push(res);
            }

            return res;
        }

        private static getSubfolder(parent: IFolder, folders: string[]): IFolder {
            if (!folders || folders.length === 0) {
                return parent;
            }

            var child = LivingDocumentationServer.findSubfolderOrCreate(parent, folders.shift());
            return LivingDocumentationServer.getSubfolder(child, folders);
        }

        private static parseFeatures(
            resource: ILivingDocumentationResourceDefinition,
            features: IFeature[],
            lastUpdatedOn: Date,
            featuresTests: IFeatureTestsSource[]): ILivingDocumentation {
            var root: IFolder = {
                name: resource.name,
                children: [],
                features: [],
                isRoot: true
            };

            var featuresTestsMap = featuresTests === null
                ? undefined : _.indexBy(featuresTests, f => f.RelativeFolder);

            var resFeatures: IFeatures = {};
            _.each(features, f => {
                var folders = f.RelativeFolder.match(/[^\\/]+/g);
                f.code = folders.pop();
                if (featuresTestsMap) {
                    LivingDocumentationServer.addTests(f, featuresTestsMap[f.RelativeFolder]);
                }

                LivingDocumentationServer.getSubfolder(root, folders).features.push(f);
                resFeatures[f.code] = f;
            });

            return {
                definition: resource,
                root: root,
                features: resFeatures,
                lastUpdatedOn: new Date(lastUpdatedOn.valueOf())
            };
        }

        private static addTests(feature: IFeature, featureTests: IFeatureTestsSource): void {
            if (!featureTests) {
                return;
            }

            var scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, s => s.ScenarioName);
            _.each(feature.Feature.FeatureElements, scenario => {
                var scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }

                scenario.tests = _.map(scenarioTests, s => testUri + s.Test);
            });
        }
    }

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
        private livingDocumentationServer: LivingDocumentationServer;

        private deferred: ng.IDeferred<ILivingDocumentationService>;

        public loading: boolean;

        public error: string;

        public ready: boolean;

        public resolve: ng.IPromise<ILivingDocumentationService>;

        public documentationList: ILivingDocumentation[] = [];

        public onStartProcessing: () => void;

        public onStopProcessing: () => void;

        public static $inject: string[] = ['$resource', '$q', '$timeout'];

        constructor(
            $resource: ng.resource.IResourceService, private $q: ng.IQService, private $timeout: ng.ITimeoutService) {
            this.livingDocumentationServer = new LivingDocumentationServer($resource, $q);
            this.loading = true;
            this.deferred = $q.defer<ILivingDocumentationService>();
            this.resolve = this.deferred.promise;
        }

        public startInitialization(): void {
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }

            this.deferred.promise.finally(() => this.onStopProcessing());

            var counter = 1;

            var onSuccess = () => {
                if (--counter <= 0) {
                    this.$timeout(
                        () => {
                            this.deferred.resolve(this);
                            this.initialize();
                        },
                        TIMEOUT);
                }
            };

            _.each(livingDocumentationResources, res => {
                ++counter;
                this.livingDocumentationServer.get(res).then(
                    doc => {
                        this.documentationList.push(doc);
                        onSuccess();
                    },
                    err => {
                        this.$timeout(
                            () => {
                                this.deferred.reject(err);
                                this.onError(err);
                            },
                            TIMEOUT);
                    });
            });

            onSuccess();
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

    export var livingDocumentationServiceAnnotated = utils.wrapInjectionConstructor(LivingDocumentationService);
}

angular
    .module('livingDocumentation.services', ['ngResource'])
    .value('version', '0.1')
    .service('livingDocumentationService', livingDocumentation.livingDocumentationServiceAnnotated);
