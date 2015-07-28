/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />

'use strict';

module livingDocumentation {
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

    interface ILivingDocumentationResourceDefinitionResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<ILivingDocumentationResourceDefinition[]>> {
    }

    interface IFeaturesSourceResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesSource>> {
    }

    interface IFeaturesTestsSourceResourceClass extends
        angular.resource.IResourceClass<ng.resource.IResource<IFeaturesTestsSource>> {
    }

    export interface ILivingDocumentationServer {
        getResourceDefinitions(): ng.IPromise<ILivingDocumentationResourceDefinition[]>;
        get(resource: ILivingDocumentationResourceDefinition): ng.IPromise<ILivingDocumentation>;
    }

    class LivingDocumentationServer {
        private featuresSourceResourceClass: IFeaturesSourceResourceClass;
        private featuresTestsSourceResourceClass: IFeaturesTestsSourceResourceClass;
        private livingDocResDefResourceClass: ILivingDocumentationResourceDefinitionResourceClass;

        constructor($resource: ng.resource.IResourceService, private $q: ng.IQService) {
            this.featuresSourceResourceClass = $resource<IFeaturesSource, IFeaturesSourceResourceClass>(
                'data/:resource', null, { get: { method: 'GET' } });

            this.featuresTestsSourceResourceClass = $resource<IFeaturesTestsSource, IFeaturesTestsSourceResourceClass>(
                'data/:resource', null, { get: { method: 'GET' } });

            this.livingDocResDefResourceClass =
            $resource<ILivingDocumentationResourceDefinition[], ILivingDocumentationResourceDefinitionResourceClass>(
                'data/:definition', null, { get: { method: 'GET', isArray: true } });
        }

        getResourceDefinitions(): ng.IPromise<ILivingDocumentationResourceDefinition[]> {
            return this.livingDocResDefResourceClass.get({ definition: 'configuration.json' }).$promise;
        }

        get(resource: ILivingDocumentationResourceDefinition): ng.IPromise<ILivingDocumentation> {
            var promiseFeatures = this.featuresSourceResourceClass.get(
                { resource: resource.featuresResource }).$promise;

            var promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.featuresTestsSourceResourceClass.get({ resource: resource.testsResources }).$promise;

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

                f.isExpanded = true;
                _.each(f.Feature.FeatureElements, s => { 
                    s.isExpanded = true;
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

            var scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, s => s.ScenarioName);
            _.each(feature.Feature.FeatureElements, scenario => {
                var scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }

                scenario.tests = _.map(scenarioTests, s => (testUri || '') + s.Test);
            });
        }
    }

    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
}
