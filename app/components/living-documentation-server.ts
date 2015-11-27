/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />

namespace livingDocumentation {
    'use strict';

    interface IFeaturesSource {
        Features: IFeature[];
        Configuration: {
            GeneratedOn: Date;
        };
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

    interface IFeaturesExternalResults {
        [feature: string]: { [scenario: string]: string; };
    }

    interface ILivingDocumentationResourceDefinitionResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<ILivingDocumentationResourceDefinition[]>> {
    }

    interface IFeaturesSourceResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesSource>> {
    }

    interface IFeaturesTestsSourceResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesTestsSource>> {
    }

    interface IFeaturesExternalResultsResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesExternalResults>> {
    }

    export interface ILivingDocumentationServer {
        getResourceDefinitions(): ng.IPromise<ILivingDocumentationResourceDefinition[]>;
        get(resource: ILivingDocumentationResourceDefinition): ng.IPromise<ILivingDocumentation>;
    }

    class LivingDocumentationServer {
        private featuresSourceResourceClass: IFeaturesSourceResourceClass;
        private featuresTestsSourceResourceClass: IFeaturesTestsSourceResourceClass;
        private featuresExternalResultsResourceClass: IFeaturesExternalResultsResourceClass;
        private livingDocResDefResourceClass: ILivingDocumentationResourceDefinitionResourceClass;

        constructor($resource: ng.resource.IResourceService, private $q: ng.IQService) {
            this.featuresSourceResourceClass = $resource<IFeaturesSource, IFeaturesSourceResourceClass>(
                'data/:resource', null, { get: { method: 'GET' } });

            this.featuresTestsSourceResourceClass = $resource<IFeaturesTestsSource, IFeaturesTestsSourceResourceClass>(
                'data/:resource', null, { get: { method: 'GET' } });

            this.featuresExternalResultsResourceClass =
            $resource<IFeaturesExternalResults, IFeaturesExternalResultsResourceClass>(
                'data/:resource', null, { get: { method: 'GET' } });

            this.livingDocResDefResourceClass =
            $resource<ILivingDocumentationResourceDefinition[], ILivingDocumentationResourceDefinitionResourceClass>(
                'data/:definition', null, { get: { method: 'GET', isArray: true } });
        }

        private static findSubfolderOrCreate(parent: IFolder, childName: string): IFolder {
            let res = _.find(parent.children, c => c.name === childName);
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

            let child = LivingDocumentationServer.findSubfolderOrCreate(parent, folders.shift());
            return LivingDocumentationServer.getSubfolder(child, folders);
        }

        private static parseFeatures(
            resource: ILivingDocumentationResourceDefinition,
            features: IFeature[],
            lastUpdatedOn: Date,
            featuresTests: IFeatureTestsSource[],
            externalTestResults: IFeaturesExternalResults): ILivingDocumentation {
            let root: IFolder = {
                name: resource.name,
                children: [],
                features: [],
                isRoot: true
            };

            let featuresTestsMap = featuresTests === null
                ? undefined : _.indexBy(featuresTests, f => f.RelativeFolder);

            let resFeatures: IFeatures = {};
            _.each(features, f => {
                let folders = f.RelativeFolder.match(/[^\\/]+/g);
                f.code = folders.pop();

                f.isExpanded = true;
                f.isManual = LivingDocumentationServer.isManual(f.Feature);
                _.each(f.Feature.FeatureElements, s => {
                    s.isExpanded = true;
                    LivingDocumentationServer.updateScenarioStatus(externalTestResults[f.Feature.Name], s);
                    s.isManual = f.isManual || LivingDocumentationServer.isManual(s);
                    s.tagsInternal = s.Tags.concat(LivingDocumentationServer.computeStatusTags(s));
                    if (s.Examples) {
                        s.Examples = (<any>s.Examples)[0];
                    }
                });
                if (f.Feature.Background) {
                    f.Feature.Background.isExpanded = true;
                    if (f.Feature.Background.Examples) {
                        f.Feature.Background.Examples = (<any>f.Feature.Background.Examples)[0];
                    }
                }

                if (featuresTestsMap) {
                    LivingDocumentationServer.addTests(f, featuresTestsMap[f.RelativeFolder], resource.testUri);
                }

                LivingDocumentationServer.getSubfolder(root, folders).features.push(f);
                LivingDocumentationServer.updateFeatureStatus(f);
                resFeatures[f.code] = f;
            });

            return {
                definition: resource,
                root: root,
                features: resFeatures,
                lastUpdatedOn: new Date(lastUpdatedOn.valueOf())
            };
        }

        private static addTests(feature: IFeature, featureTests: IFeatureTestsSource, testUri: string): void {
            if (!featureTests) {
                return;
            }

            let scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, s => s.ScenarioName);
            _.each(feature.Feature.FeatureElements, scenario => {
                let scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }

                scenario.tests = _.map(scenarioTests, s => (testUri || '') + s.Test);
            });
        }

        private static isManual(item: { Tags: string[]; }): boolean {
            return _.indexOf(item.Tags, '@manual') !== -1;
        }

        private static computeStatusTags(scenario: IScenario): string[] {
            if (scenario.isManual) {
                return [];
            }

            if (!scenario.Result.WasExecuted) {
                return ['@pending'];
            }

            if (!scenario.Result.WasSuccessful) {
                return ['@failing'];
            }

            return [];
        }

        private static updateScenarioStatus(
            externalTestResults: { [scenario: string]: string; }, scenario: IScenario): void {
            if (!externalTestResults) {
                return;
            }

            const scenarioTestRes = externalTestResults[scenario.Name];
            if (!scenarioTestRes) {
                return;
            }

            switch (scenarioTestRes) {
                case 'passed':
                    [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [true, true];
                    break;
                case 'pending':
                    [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [false, false];
                    break;
                case 'failed':
                    [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [true, false];
                    break;
                default: throw Error();
            }
        }

        private static updateFeatureStatus(feature: IFeature): void {
            if (_.any(feature.Feature.FeatureElements, s => s.Result.WasExecuted && !s.Result.WasSuccessful)) {
                feature.Feature.Result = { WasExecuted: true, WasSuccessful: false };
                return;
            }

            if (_.any(feature.Feature.FeatureElements, s => !s.Result.WasExecuted)) {
                feature.Feature.Result = { WasExecuted: false, WasSuccessful: false };
                return;
            }

            feature.Feature.Result = { WasExecuted: true, WasSuccessful: true };
        }

        getResourceDefinitions(): ng.IPromise<ILivingDocumentationResourceDefinition[]> {
            return this.livingDocResDefResourceClass.get({ definition: 'configuration.json' }).$promise;
        }

        get(resource: ILivingDocumentationResourceDefinition): ng.IPromise<ILivingDocumentation> {
            let promiseFeatures = this.featuresSourceResourceClass.get(
                { resource: resource.featuresResource }).$promise;

            let promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.featuresTestsSourceResourceClass.get({ resource: resource.testsResources }).$promise;

            let promiseExternalResults = !resource.externalTestResults
                ? this.$q.when(null)
                : this.featuresExternalResultsResourceClass.get({ resource: resource.externalTestResults }).$promise;

            return this.$q.all([promiseFeatures, promiseTests, promiseExternalResults]).then(
                (arr: any[]) => LivingDocumentationServer.parseFeatures(
                    resource,
                    arr[0].Features,
                    arr[0].Configuration.GeneratedOn,
                    !arr[1] ? null : arr[1].FeaturesTests,
                    arr[2] || {}));
        }
    }

    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
}
