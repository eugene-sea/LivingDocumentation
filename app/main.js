'use strict';
var utils;
(function (utils) {
    function wrapInjectionConstructor(constructor, transformer) {
        return constructor.$inject.concat(function () {
            var functionConstructor = constructor.bind.apply(constructor, [null].concat(Array.prototype.slice.call(arguments, 0)));
            var res = new functionConstructor();
            return !transformer ? res : transformer(res);
        });
    }
    utils.wrapInjectionConstructor = wrapInjectionConstructor;
    function wrapFilterInjectionConstructor(constructor) {
        return utils.wrapInjectionConstructor(constructor, function (f) {
            return f.filter.bind(f);
        });
    }
    utils.wrapFilterInjectionConstructor = wrapFilterInjectionConstructor;
})(utils || (utils = {}));
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    livingDocumentation.testUri = 'http://example.com/Tests/?Test=';
    livingDocumentation.livingDocumentationResources = [
        {
            code: 'test',
            name: 'Test Knowledge Base',
            description: '',
            sortOrder: 1,
            featuresResource: 'test-data.json',
            testsResources: 'test-data-tests.json'
        }
    ];
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="configuration.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var LivingDocumentationServer = (function () {
        function LivingDocumentationServer($resource, $q) {
            this.$q = $q;
            this.livingDocumentationResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
        }
        LivingDocumentationServer.prototype.get = function (resource) {
            var promiseFeatures = this.livingDocumentationResourceClass.get({ resource: resource.featuresResource })['$promise'];
            var promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.livingDocumentationResourceClass.get({ resource: resource.testsResources })['$promise'];
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
        };
        LivingDocumentationServer.addTests = function (feature, featureTests) {
            if (!featureTests) {
                return;
            }
            var scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, function (s) { return s.ScenarioName; });
            _.each(feature.Feature.FeatureElements, function (scenario) {
                var scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }
                scenario.tests = _.map(scenarioTests, function (s) { return livingDocumentation.testUri + s.Test; });
            });
        };
        return LivingDocumentationServer;
    })();
    var TIMEOUT = 200;
    var LivingDocumentationService = (function () {
        function LivingDocumentationService($resource, $q, $timeout) {
            this.$q = $q;
            this.$timeout = $timeout;
            this.documentationList = [];
            this.livingDocumentationServer = new LivingDocumentationServer($resource, $q);
            this.loading = true;
            this.deferred = $q.defer();
            this.resolve = this.deferred.promise;
        }
        LivingDocumentationService.prototype.startInitialization = function () {
            var _this = this;
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }
            this.deferred.promise.finally(function () { return _this.onStopProcessing(); });
            var counter = 1;
            var onSuccess = function () {
                if (--counter <= 0) {
                    _this.$timeout(function () {
                        _this.deferred.resolve(_this);
                        _this.initialize();
                    }, TIMEOUT);
                }
            };
            _.each(livingDocumentation.livingDocumentationResources, function (res) {
                ++counter;
                _this.livingDocumentationServer.get(res).then(function (doc) {
                    _this.documentationList.push(doc);
                    onSuccess();
                }, function (err) {
                    _this.$timeout(function () {
                        _this.deferred.reject(err);
                        _this.onError(err);
                    }, TIMEOUT);
                });
            });
            onSuccess();
        };
        LivingDocumentationService.prototype.onError = function (err) {
            console.error(err);
            this.error = err;
            this.loading = false;
        };
        LivingDocumentationService.prototype.initialize = function () {
            this.loading = false;
            this.ready = true;
        };
        LivingDocumentationService.$inject = ['$resource', '$q', '$timeout'];
        return LivingDocumentationService;
    })();
    livingDocumentation.livingDocumentationServiceAnnotated = utils.wrapInjectionConstructor(LivingDocumentationService);
})(livingDocumentation || (livingDocumentation = {}));
angular
    .module('livingDocumentation.services', ['ngResource'])
    .value('version', '0.1')
    .service('livingDocumentationService', livingDocumentation.livingDocumentationServiceAnnotated);
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="js/services.ts" />
'use strict';
angular.module('livingDocumentation', [
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'livingDocumentation.filters',
    'livingDocumentation.services',
    'livingDocumentation.directives',
    'livingDocumentation.controllers',
    'livingDocumentation.controllers.root'
]).config(['$routeProvider', function ($routeProvider) {
        var resolve = {
            livingDocumentationServiceReady: [
                'livingDocumentationService',
                function (service) { return service.resolve; }
            ]
        };
        $routeProvider.when('/home', {
            templateUrl: 'partials/home.html',
            controller: 'Home',
            resolve: resolve
        });
        $routeProvider.when('/feature/:documentationCode/:featureCode', {
            templateUrl: 'partials/feature.html',
            controller: 'Feature',
            resolve: resolve
        });
        $routeProvider.otherwise({ redirectTo: '/home' });
    }]);
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../js/services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var RootCtrl = (function () {
        function RootCtrl(livingDocService, $modal) {
            this.livingDocService = livingDocService;
            this.documentationList = livingDocService.documentationList;
            var modalInstance;
            livingDocService.onStartProcessing = function () {
                if (modalInstance) {
                    return;
                }
                modalInstance = $modal.open({ templateUrl: 'processing.html', backdrop: 'static', keyboard: false });
            };
            livingDocService.onStopProcessing = function () {
                modalInstance.close();
                modalInstance = null;
            };
            livingDocService.startInitialization();
        }
        Object.defineProperty(RootCtrl.prototype, "loading", {
            get: function () { return this.livingDocService.loading; },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "error", {
            get: function () { return this.livingDocService.error; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "ready", {
            get: function () { return this.livingDocService.ready; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "lastUpdatedOn", {
            get: function () {
                return _.find(this.livingDocService.documentationList, function (doc) { return doc.lastUpdatedOn; }).lastUpdatedOn;
            },
            enumerable: true,
            configurable: true
        });
        RootCtrl.$inject = ['livingDocumentationService', '$modal'];
        return RootCtrl;
    })();
    angular.module('livingDocumentation.controllers.root', ['livingDocumentation.services'])
        .controller('RootCtrl', RootCtrl);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var Home = (function () {
        function Home($scope, livingDocumentationService) {
        }
        Home.$inject = ['$scope', 'livingDocumentationService'];
        return Home;
    })();
    livingDocumentation.homeAnnotated = utils.wrapInjectionConstructor(Home);
    var Feature = (function () {
        function Feature($scope, $routeParams, livingDocumentationService) {
            var doc = _.find(livingDocumentationService.documentationList, function (doc) { return doc.definition.code === $routeParams['documentationCode']; });
            $scope['feature'] = doc.features[$routeParams['featureCode']];
        }
        Feature.$inject = ['$scope', '$routeParams', 'livingDocumentationService'];
        return Feature;
    })();
    livingDocumentation.featureAnnotated = utils.wrapInjectionConstructor(Feature);
})(livingDocumentation || (livingDocumentation = {}));
angular.module('livingDocumentation.controllers', ['livingDocumentation.services'])
    .controller('Home', livingDocumentation.homeAnnotated)
    .controller('Feature', livingDocumentation.featureAnnotated);
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var AppVersion = (function () {
        function AppVersion(version) {
            var _this = this;
            this.version = version;
            this.link = function (scope, element, attributes) { return _this.linkCore(element); };
        }
        AppVersion.prototype.linkCore = function (element) {
            element.text(this.version);
        };
        AppVersion.$inject = ['version'];
        return AppVersion;
    })();
    livingDocumentation.appVersionAnnotated = utils.wrapInjectionConstructor(AppVersion);
    var IsActive = (function () {
        function IsActive($location) {
            var _this = this;
            this.$location = $location;
            this.link = function (scope, element, attributes) { return _this.linkCore(scope, element, attributes); };
        }
        IsActive.prototype.linkCore = function (scope, element, attributes) {
            var _this = this;
            var handler = function () {
                var isActive;
                if (attributes['isActive']) {
                    isActive = _this.$location.path().indexOf(attributes['isActive']) === 0;
                }
                else {
                    var indexOf = _this.$location.path().indexOf(attributes['isActiveLast']);
                    isActive = indexOf >= 0 &&
                        (indexOf + attributes['isActiveLast'].length === _this.$location.path().length);
                }
                if (isActive) {
                    element.addClass('active');
                }
                else {
                    element.removeClass('active');
                }
            };
            handler();
            IsActive.subscribe(scope, handler);
            if (scope.$parent) {
                IsActive.subscribe(scope.$parent, handler);
            }
        };
        IsActive.subscribe = function (scope, handler) {
            scope.$on('$routeChangeSuccess', handler);
            scope.$on('$includeContentLoaded', handler);
        };
        IsActive.$inject = ['$location'];
        return IsActive;
    })();
    livingDocumentation.isActiveAnnotated = utils.wrapInjectionConstructor(IsActive);
})(livingDocumentation || (livingDocumentation = {}));
angular
    .module('livingDocumentation.directives', [])
    .directive('appVersion', livingDocumentation.appVersionAnnotated)
    .directive('isActive', livingDocumentation.isActiveAnnotated)
    .directive('isActiveLast', livingDocumentation.isActiveAnnotated);
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var NewLineFilter = (function () {
        function NewLineFilter() {
        }
        NewLineFilter.prototype.filter = function (str) {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        };
        NewLineFilter.$inject = [];
        return NewLineFilter;
    })();
    livingDocumentation.newLineFilterAnnotated = utils.wrapFilterInjectionConstructor(NewLineFilter);
})(livingDocumentation || (livingDocumentation = {}));
angular
    .module('livingDocumentation.filters', [])
    .filter('newline', livingDocumentation.newLineFilterAnnotated);
//# sourceMappingURL=main.js.map