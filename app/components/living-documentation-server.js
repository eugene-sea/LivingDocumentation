/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
var livingDocumentation;
(function (livingDocumentation) {
    'use strict';
    var LivingDocumentationServer = (function () {
        function LivingDocumentationServer($resource, $q) {
            this.$q = $q;
            this.featuresSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.featuresTestsSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.featuresExternalResultsResourceClass =
                $resource('data/:resource', null, { get: { method: 'GET' } });
            this.livingDocResDefResourceClass =
                $resource('data/:definition', null, { get: { isArray: true, method: 'GET' } });
        }
        LivingDocumentationServer.findSubfolderOrCreate = function (parent, childName) {
            var res = _.find(parent.children, function (c) { return c.name === childName; });
            if (!res) {
                res = {
                    children: [],
                    features: [],
                    name: childName
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
        LivingDocumentationServer.parseFeatures = function (resource, features, lastUpdatedOn, featuresTests, externalTestResults) {
            var root = {
                children: [],
                features: [],
                isRoot: true,
                name: resource.name
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
                    LivingDocumentationServer.updateScenarioStatus(externalTestResults[f.Feature.Name], s);
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
                LivingDocumentationServer.updateFeatureStatus(f);
                resFeatures[f.code] = f;
            });
            return {
                definition: resource,
                features: resFeatures,
                lastUpdatedOn: new Date(lastUpdatedOn.valueOf()),
                root: root
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
        LivingDocumentationServer.updateScenarioStatus = function (externalTestResults, scenario) {
            if (!externalTestResults) {
                return;
            }
            var scenarioTestRes = externalTestResults[scenario.Name];
            if (!scenarioTestRes) {
                return;
            }
            switch (scenarioTestRes) {
                case 'passed':
                    _a = [true, true], scenario.Result.WasExecuted = _a[0], scenario.Result.WasSuccessful = _a[1];
                    break;
                case 'pending':
                    _b = [false, false], scenario.Result.WasExecuted = _b[0], scenario.Result.WasSuccessful = _b[1];
                    break;
                case 'failed':
                    _c = [true, false], scenario.Result.WasExecuted = _c[0], scenario.Result.WasSuccessful = _c[1];
                    break;
                default: throw Error();
            }
            var _a, _b, _c;
        };
        LivingDocumentationServer.updateFeatureStatus = function (feature) {
            if (_.any(feature.Feature.FeatureElements, function (s) { return s.Result.WasExecuted && !s.Result.WasSuccessful; })) {
                feature.Feature.Result = { WasExecuted: true, WasSuccessful: false };
                return;
            }
            if (_.any(feature.Feature.FeatureElements, function (s) { return !s.isManual && !s.Result.WasExecuted; })) {
                feature.Feature.Result = { WasExecuted: false, WasSuccessful: false };
                return;
            }
            feature.Feature.Result = { WasExecuted: true, WasSuccessful: true };
        };
        LivingDocumentationServer.prototype.getResourceDefinitions = function () {
            return this.livingDocResDefResourceClass.get({ definition: 'configuration.json' }).$promise;
        };
        LivingDocumentationServer.prototype.get = function (resource) {
            var promiseFeatures = this.featuresSourceResourceClass.get({ resource: resource.featuresResource }).$promise;
            var promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.featuresTestsSourceResourceClass.get({ resource: resource.testsResources }).$promise;
            var promiseExternalResults = !resource.externalTestResults
                ? this.$q.when(null)
                : this.featuresExternalResultsResourceClass.get({ resource: resource.externalTestResults }).$promise;
            return this.$q.all([promiseFeatures, promiseTests, promiseExternalResults]).then(function (arr) { return LivingDocumentationServer.parseFeatures(resource, arr[0].Features, arr[0].Configuration.GeneratedOn, !arr[1] ? null : arr[1].FeaturesTests, arr[2] || {}); });
        };
        return LivingDocumentationServer;
    })();
    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=living-documentation-server.js.map