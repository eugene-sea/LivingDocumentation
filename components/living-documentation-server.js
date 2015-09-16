/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var LivingDocumentationServer = (function () {
        function LivingDocumentationServer($resource, $q) {
            this.$q = $q;
            this.featuresSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.featuresTestsSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.livingDocResDefResourceClass =
                $resource('data/:definition', null, { get: { method: 'GET', isArray: true } });
        }
        LivingDocumentationServer.prototype.getResourceDefinitions = function () {
            return this.livingDocResDefResourceClass.get({ definition: 'configuration.json' }).$promise;
        };
        LivingDocumentationServer.prototype.get = function (resource) {
            var promiseFeatures = this.featuresSourceResourceClass.get({ resource: resource.featuresResource }).$promise;
            var promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.featuresTestsSourceResourceClass.get({ resource: resource.testsResources }).$promise;
            return this.$q.all([promiseFeatures, promiseTests]).then(function (arr) { return LivingDocumentationServer.parseFeatures(resource, arr[0].Features, arr[0].Configuration.GeneratedOn, !arr[1] ? null : arr[1].FeaturesTests); });
        };
        LivingDocumentationServer.findSubfolderOrCreate = function (parent, childName) {
            var res = _.find(parent.children, function (c) { return c.name === childName; });
            if (!res) {
                res = {
                    name: childName,
                    children: [],
                    features: []
                };
                parent.children.push(res);
            }
            return res;
        };
        LivingDocumentationServer.getSubfolder = function (parent, folders) {
            if (!folders || folders.length === 0) {
                return parent;
            }
            var child = LivingDocumentationServer.findSubfolderOrCreate(parent, folders.shift());
            return LivingDocumentationServer.getSubfolder(child, folders);
        };
        LivingDocumentationServer.parseFeatures = function (resource, features, lastUpdatedOn, featuresTests) {
            var root = {
                name: resource.name,
                children: [],
                features: [],
                isRoot: true
            };
            var featuresTestsMap = featuresTests === null
                ? undefined : _.indexBy(featuresTests, function (f) { return f.RelativeFolder; });
            var resFeatures = {};
            _.each(features, function (f) {
                var folders = f.RelativeFolder.match(/[^\\/]+/g);
                f.code = folders.pop();
                f.isExpanded = true;
                f.isManual = LivingDocumentationServer.isManual(f.Feature);
                _.each(f.Feature.FeatureElements, function (s) {
                    s.isExpanded = true;
                    s.isManual = f.isManual || LivingDocumentationServer.isManual(s);
                    s.tagsInternal = s.Tags.concat(LivingDocumentationServer.computeStatusTags(s));
                    if (s.Examples) {
                        s.Examples = s.Examples[0];
                    }
                });
                if (f.Feature.Background) {
                    f.Feature.Background.isExpanded = true;
                    if (f.Feature.Background.Examples) {
                        f.Feature.Background.Examples = f.Feature.Background.Examples[0];
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
        };
        LivingDocumentationServer.addTests = function (feature, featureTests, testUri) {
            if (!featureTests) {
                return;
            }
            var scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, function (s) { return s.ScenarioName; });
            _.each(feature.Feature.FeatureElements, function (scenario) {
                var scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }
                scenario.tests = _.map(scenarioTests, function (s) { return (testUri || '') + s.Test; });
            });
        };
        LivingDocumentationServer.isManual = function (item) {
            return _.indexOf(item.Tags, '@manual') !== -1;
        };
        LivingDocumentationServer.computeStatusTags = function (scenario) {
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
        };
        return LivingDocumentationServer;
    })();
    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=living-documentation-server.js.map