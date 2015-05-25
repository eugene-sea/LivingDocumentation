'use strict';
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
        return LivingDocumentationServer;
    })();
    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var TIMEOUT = 200;
    var LivingDocumentationService = (function () {
        function LivingDocumentationService(livingDocumentationServer, $q, $timeout) {
            this.livingDocumentationServer = livingDocumentationServer;
            this.$q = $q;
            this.$timeout = $timeout;
            this.documentationList = [];
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
            this.livingDocumentationServer.getResourceDefinitions()
                .then(function (resources) { return _this.$q.all(_.map(resources, function (r) { return _this.livingDocumentationServer.get(r); })); })
                .then(function (docs) {
                _this.documentationList = docs;
                _this.$timeout(function () {
                    _this.deferred.resolve(_this);
                    _this.initialize();
                }, TIMEOUT);
            }, function (err) { return _this.$timeout(function () {
                _this.deferred.reject(err);
                _this.onError(err);
            }, TIMEOUT); });
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
        LivingDocumentationService.$inject = ['livingDocumentationServer', '$q', '$timeout'];
        return LivingDocumentationService;
    })();
    angular.module('livingDocumentation.services', ['livingDocumentation.services.server'])
        .value('version', '0.1')
        .service('livingDocumentationService', LivingDocumentationService);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="components/services.ts" />
'use strict';
angular.module('livingDocumentation', [
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'livingDocumentation.filters',
    'livingDocumentation.services',
    'livingDocumentation.directives',
    'livingDocumentation.controllers.root',
    'livingDocumentation.controllers.home',
    'livingDocumentation.documentationList',
    'livingDocumentation.feature',
]).config(['$routeProvider', function ($routeProvider) {
        var resolve = {
            livingDocumentationServiceReady: [
                'livingDocumentationService',
                function (service) { return service.resolve; }
            ]
        };
        $routeProvider.when('/home', {
            template: '<div home></div>',
            resolve: resolve
        });
        $routeProvider.when('/feature/:documentationCode/:featureCode', {
            template: function ($routeParams) {
                return ("<div feature\n                feature-code=\"" + $routeParams['featureCode'] + "\"\n                documentation-code=\"" + $routeParams['documentationCode'] + "\">\n             </div>");
            },
            resolve: resolve
        });
        $routeProvider.otherwise({ redirectTo: '/home' });
    }]);
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var RootCtrl = (function () {
        function RootCtrl(livingDocService, $modal) {
            this.livingDocService = livingDocService;
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
/// <reference path="utils.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var HomeDirective = (function () {
        function HomeDirective() {
            this.restrict = 'A';
            this.controller = Home;
            this.controllerAs = 'home';
            this.bindToController = true;
            this.template = '';
        }
        HomeDirective.$inject = [];
        return HomeDirective;
    })();
    var Home = (function () {
        function Home() {
        }
        return Home;
    })();
    angular.module('livingDocumentation.controllers.home', [])
        .directive('home', utils.wrapInjectionConstructor(HomeDirective));
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
'use strict';
var utils;
(function (utils) {
    var RecursionHelper = (function () {
        function RecursionHelper($compile) {
            this.$compile = $compile;
        }
        RecursionHelper.prototype.compile = function (element, linkArg) {
            var link;
            // Normalize the link parameter
            if (angular.isFunction(linkArg)) {
                link = { post: linkArg };
            }
            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents;
            var _this = this;
            return {
                pre: (link && link.pre) ? link.pre : null,
                post: function (scope, element) {
                    // Compile the contents
                    if (!compiledContents) {
                        compiledContents = _this.$compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function (clone) {
                        element.append(clone);
                    });
                    // Call the post-linking function, if any
                    if (link && link.post) {
                        link.post.apply(null, arguments);
                    }
                }
            };
        };
        RecursionHelper.$inject = ['$compile'];
        return RecursionHelper;
    })();
    utils.RecursionHelper = RecursionHelper;
    angular.module('livingDocumentation.services.recursionHelper', [])
        .service('recursionHelper', RecursionHelper);
})(utils || (utils = {}));
/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />
/// <reference path="../recursion-helper.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var DocumentationListDirective = (function () {
        function DocumentationListDirective() {
            this.restrict = 'A';
            this.controller = 'DocumentationList';
            this.controllerAs = 'root';
            this.bindToController = true;
            this.templateUrl = 'components/documentation_list/documentation-list.tpl.html';
        }
        DocumentationListDirective.$inject = [];
        return DocumentationListDirective;
    })();
    var DocumentationList = (function () {
        function DocumentationList(livingDocService) {
            this.documentationList = livingDocService.documentationList;
        }
        DocumentationList.$inject = ['livingDocumentationService'];
        return DocumentationList;
    })();
    var FolderDirective = (function () {
        function FolderDirective(recursionHelper) {
            var _this = this;
            this.recursionHelper = recursionHelper;
            this.restrict = 'A';
            this.scope = {
                folder: '=',
                documentationCode: '='
            };
            this.controller = Folder;
            this.controllerAs = 'ctrl';
            this.bindToController = true;
            this.templateUrl = 'components/documentation_list/folder.tpl.html';
            this.compile = function (element) { return _this.recursionHelper.compile(element); };
        }
        FolderDirective.$inject = ['recursionHelper'];
        return FolderDirective;
    })();
    var Folder = (function () {
        function Folder() {
        }
        return Folder;
    })();
    angular.module('livingDocumentation.documentationList', [
        'livingDocumentation.services',
        'livingDocumentation.services.recursionHelper'
    ])
        .directive('documentationList', utils.wrapInjectionConstructor(DocumentationListDirective))
        .controller('DocumentationList', DocumentationList)
        .directive('folder', utils.wrapInjectionConstructor(FolderDirective));
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var FeatureDirective = (function () {
        function FeatureDirective() {
            this.restrict = 'A';
            this.scope = {
                featureCode: '@',
                documentationCode: '@'
            };
            this.controller = 'Feature';
            this.controllerAs = 'ctrl';
            this.bindToController = true;
            this.templateUrl = 'components/feature/feature.tpl.html';
        }
        FeatureDirective.$inject = [];
        return FeatureDirective;
    })();
    var Feature = (function () {
        function Feature(livingDocumentationService) {
            var _this = this;
            var doc = _.find(livingDocumentationService.documentationList, function (doc) { return doc.definition.code === _this.documentationCode; });
            this.feature = doc.features[this.featureCode];
        }
        Feature.$inject = ['livingDocumentationService'];
        return Feature;
    })();
    var ScenarioDirective = (function () {
        function ScenarioDirective() {
            this.restrict = 'A';
            this.scope = {
                scenario: '='
            };
            this.controller = Scenario;
            this.controllerAs = 'ctrl';
            this.bindToController = true;
            this.templateUrl = 'components/feature/scenario.tpl.html';
        }
        ScenarioDirective.$inject = [];
        return ScenarioDirective;
    })();
    var Scenario = (function () {
        function Scenario() {
        }
        return Scenario;
    })();
    angular.module('livingDocumentation.feature', ['livingDocumentation.services'])
        .directive('feature', utils.wrapInjectionConstructor(FeatureDirective))
        .controller('Feature', Feature)
        .directive('scenario', utils.wrapInjectionConstructor(ScenarioDirective));
})(livingDocumentation || (livingDocumentation = {}));
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
        };
        IsActive.subscribe = function (scope, handler) {
            scope.$on('$routeChangeSuccess', handler);
            scope.$on('$includeContentLoaded', handler);
        };
        IsActive.$inject = ['$location'];
        return IsActive;
    })();
    angular
        .module('livingDocumentation.directives', [])
        .directive('appVersion', utils.wrapInjectionConstructor(AppVersion))
        .directive('isActive', utils.wrapInjectionConstructor(IsActive))
        .directive('isActiveLast', utils.wrapInjectionConstructor(IsActive));
})(livingDocumentation || (livingDocumentation = {}));
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
    angular
        .module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter));
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=main.js.map