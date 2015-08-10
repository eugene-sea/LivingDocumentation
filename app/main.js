'use strict';
'use strict';
var utils;
(function (utils) {
    function wrapInjectionConstructor(constructor, transformer) {
        return (constructor.$inject || []).concat(function () {
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
                f.isExpanded = true;
                _.each(f.Feature.FeatureElements, function (s) {
                    s.isExpanded = true;
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
        return LivingDocumentationServer;
    })();
    angular.module('livingDocumentation.services.server', ['ngResource'])
        .service('livingDocumentationServer', LivingDocumentationServer);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    function splitWords(str) {
        var res = str[0];
        for (var i = 1; i < str.length; ++i) {
            var prev = str[i - 1], cur = str[i], next = i < str.length - 1 ? str[i] : null;
            if (!isUpperCase(prev)) {
                if (prev !== ' ' && isUpperCase(cur)) {
                    res += ' ';
                }
            }
            else if (isUpperCase(cur) && next && !isUpperCase(next)) {
                res += ' ';
            }
            res += cur;
        }
        return res;
    }
    livingDocumentation.splitWords = splitWords;
    function isUpperCase(s) {
        return s === s.toUpperCase() && s !== s.toLowerCase();
    }
    function isTextPresent(_a, str) {
        var searchRegExp = _a.searchRegExp;
        return !searchRegExp || (str && str.search(searchRegExp) >= 0);
    }
    function isTextPresentRegEx(regEx, str) {
        return str && str.search(regEx) >= 0;
    }
    function getSearchContext(searchText) {
        searchText = searchText || '';
        var tagRegEx = /(@[^\s]+)(\s|$)/g;
        var regExRes;
        var resStr = '';
        var resTags = [];
        var prevLastIndex = 0;
        while ((regExRes = tagRegEx.exec(searchText)) !== null) {
            resStr += searchText.slice(prevLastIndex, regExRes.index);
            resTags.push(new RegExp(regExRes[1], 'i'));
            prevLastIndex = tagRegEx.lastIndex;
        }
        resStr += searchText.slice(prevLastIndex, searchText.length);
        resStr = resStr.trim();
        return { tags: resTags, searchRegExp: resStr ? new RegExp(resStr, 'gi') : null };
    }
    function isTextPresentInDocumentation(searchContext, doc) {
        var root = isTextPresentInFolder(searchContext, doc.root);
        if (!root) {
            return null;
        }
        var features = {};
        addFeatures(root, features);
        return {
            definition: doc.definition,
            root: root,
            features: features,
            lastUpdatedOn: doc.lastUpdatedOn
        };
    }
    function isTextPresentInFolder(searchContext, folder) {
        var isTextPresentInTitle = !folder.isRoot && !_.any(searchContext.tags) &&
            isTextPresent(searchContext, splitWords(folder.name));
        var features = _.filter(_.map(folder.features, function (f) { return isTextPresentInFeature(searchContext, f); }), function (f) { return !!f; });
        var folders = _.filter(_.map(folder.children, function (f) { return isTextPresentInFolder(searchContext, f); }), function (f) { return !!f; });
        if (!isTextPresentInTitle && !_.any(features) && !_.any(folders)) {
            return null;
        }
        return {
            name: folder.name,
            children: folders,
            features: features,
            isRoot: folder.isRoot
        };
    }
    function isTextPresentInFeature(searchContext, feature) {
        var tagsScenariosMap = _.map(searchContext.tags, function (t) { return isTagPresentInFeature(t, feature); });
        if (_.any(tagsScenariosMap, function (a) { return a === null; })) {
            return null;
        }
        var tagsScenarios = _.union.apply(_, tagsScenariosMap);
        var isTextPresentInTitle = isTextPresent(searchContext, feature.Feature.Name);
        var isTextPresentInDescription = isTextPresent(searchContext, feature.Feature.Description);
        var isTextPresentInBackground = feature.Feature.Background && isTextPresentInScenario(searchContext, feature.Feature.Background);
        // Intersection is made to preserve original order between scenarios
        var scenarios = !_.any(searchContext.tags)
            ? feature.Feature.FeatureElements : _.intersection(feature.Feature.FeatureElements, tagsScenarios);
        scenarios = _.filter(scenarios, function (s) { return isTextPresentInScenario(searchContext, s); });
        if (!isTextPresentInTitle && !isTextPresentInDescription && !isTextPresentInBackground && !_.any(scenarios)) {
            return null;
        }
        return {
            code: feature.code,
            get isExpanded() { return feature.isExpanded; },
            set isExpanded(value) { feature.isExpanded = value; },
            RelativeFolder: feature.RelativeFolder,
            Feature: {
                Name: feature.Feature.Name,
                Description: feature.Feature.Description,
                Tags: feature.Feature.Tags,
                Background: !isTextPresentInBackground ? null : feature.Feature.Background,
                FeatureElements: scenarios
            }
        };
    }
    function isTextPresentInScenario(searchContext, scenario) {
        if (isTextPresent(searchContext, scenario.Name)) {
            return true;
        }
        if (isTextPresent(searchContext, scenario.Description)) {
            return true;
        }
        if (scenario.Examples) {
            if (isTextPresent(searchContext, scenario.Examples.Decription)) {
                return true;
            }
            if (isTextPresentInTable(searchContext, scenario.Examples.TableArgument)) {
                return true;
            }
        }
        return _.any(scenario.Steps, function (s) { return isTextPresentInStep(searchContext, s); });
    }
    function isTextPresentInTable(searchContext, table) {
        if (_.any(table.HeaderRow, function (s) { return isTextPresent(searchContext, s); })) {
            return true;
        }
        return _.any(table.DataRows, function (r) { return _.any(r, function (s) { return isTextPresent(searchContext, s); }); });
    }
    function isTextPresentInStep(searchContext, step) {
        if (step.TableArgument && isTextPresentInTable(searchContext, step.TableArgument)) {
            return true;
        }
        return isTextPresent(searchContext, step.Name) || isTextPresent(searchContext, step.DocStringArgument);
    }
    function isTagPresentInFeature(tag, feature) {
        if (_.any(feature.Feature.Tags, function (t) { return isTextPresentRegEx(tag, t); })) {
            return feature.Feature.FeatureElements;
        }
        var scenarios = _.filter(feature.Feature.FeatureElements, function (s) { return _.any(s.Tags, function (t) { return isTextPresentRegEx(tag, t); }); });
        return !_.any(scenarios) ? null : scenarios;
    }
    function addFeatures(folder, features) {
        _.each(_.sortBy(folder.children, function (f) { return f.name; }), function (f) { return addFeatures(f, features); });
        _.each(_.sortBy(folder.features, function (f) { return f.Feature.Name; }), function (f) { return features[f.code] = f; });
    }
    var SearchService = (function () {
        function SearchService() {
        }
        SearchService.prototype.search = function (searchText, documentationList) {
            var searchContext = getSearchContext(searchText);
            var documentationList = _.filter(_.map(documentationList, function (d) { return isTextPresentInDocumentation(searchContext, d); }), function (d) { return !!d; });
            documentationList = _.sortBy(documentationList, function (d) { return d.definition.sortOrder; });
            return {
                documentationList: documentationList,
                searchContext: searchContext
            };
        };
        return SearchService;
    })();
    angular.module('livingDocumentation.services.search', [])
        .service('search', SearchService);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />
/// <reference path="search-service.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var TIMEOUT = 200;
    var LivingDocumentationService = (function () {
        function LivingDocumentationService(livingDocumentationServer, $q, $timeout, searchService, $location, $route) {
            this.livingDocumentationServer = livingDocumentationServer;
            this.$q = $q;
            this.$timeout = $timeout;
            this.searchService = searchService;
            this.$location = $location;
            this.$route = $route;
            this.currentSearchText = '';
            this.documentationList = [];
            this.filteredDocumentationList = [];
            this.searchContext = null;
            this.loading = true;
            this.deferred = $q.defer();
            this.resolve = this.deferred.promise;
        }
        Object.defineProperty(LivingDocumentationService.prototype, "searchText", {
            get: function () { return this.$location.search().search; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationService.prototype, "urlSearchPart", {
            get: function () {
                return !this.searchText && !this.showInProgressOnly
                    ? ''
                    : ("?search=" + encodeURIComponent(this.searchText || '')) +
                        (!this.showInProgressOnly ? '' : '&showInProgressOnly');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationService.prototype, "showInProgressOnly", {
            get: function () {
                return !!this.$location.search().showInProgressOnly;
            },
            enumerable: true,
            configurable: true
        });
        LivingDocumentationService.prototype.startInitialization = function () {
            var _this = this;
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }
            this.deferred.promise.finally(function () { return _this.onStopProcessing(); }).catch(function (err) { return _this.onError(err); });
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
        LivingDocumentationService.prototype.search = function (searchText) {
            this.$location.search('search', searchText);
            if (!searchText) {
                this.$location.search('showInProgressOnly', null);
                _a = [this.documentationList, null, null], this.filteredDocumentationList = _a[0], this.searchContext = _a[1], this.currentSearchText = _a[2];
                return;
            }
            this.searchCore();
            var _a;
        };
        LivingDocumentationService.prototype.toggleShowInProgressOnly = function (initialize) {
            if (!initialize) {
                this.$location.search('showInProgressOnly', !this.showInProgressOnly ? true : null);
            }
            this.searchCore();
        };
        LivingDocumentationService.prototype.onError = function (err) {
            console.error(err);
            this.error = err;
            this.loading = false;
        };
        LivingDocumentationService.prototype.initialize = function () {
            this.loading = false;
            this.ready = true;
            this.filteredDocumentationList = this.documentationList;
        };
        LivingDocumentationService.prototype.searchCore = function () {
            var searchText = !this.showInProgressOnly ? this.searchText : '@iteration ' + (this.searchText || '');
            if (searchText !== this.currentSearchText) {
                var res = this.searchService.search(searchText, this.documentationList);
                _a = [res.documentationList, res.searchContext, searchText], this.filteredDocumentationList = _a[0], this.searchContext = _a[1], this.currentSearchText = _a[2];
            }
            var _b = !this.$route.current
                ? [null, null]
                : [
                    this.$route.current.params['documentationCode'],
                    this.$route.current.params['featureCode']
                ], documentationCode = _b[0], featureCode = _b[1];
            if (documentationCode && featureCode) {
                var documentation = _.find(this.filteredDocumentationList, function (doc) { return doc.definition.code === documentationCode; });
                if (!documentation) {
                    documentationCode = null;
                }
                else {
                    var feature = documentation.features[featureCode];
                    if (!feature) {
                        featureCode = null;
                    }
                }
            }
            if (!documentationCode || !featureCode) {
                var documentation = _.find(this.filteredDocumentationList, function (d) { return _.any(d.features); });
                if (documentation) {
                    _c = [documentation.definition.code, _.find(documentation.features, function (_) { return true; }).code], documentationCode = _c[0], featureCode = _c[1];
                }
            }
            if (!documentationCode || !featureCode) {
                this.$location.path('/home');
            }
            else {
                this.$location.path("/feature/" + documentationCode + "/" + featureCode);
            }
            var _a, _c;
        };
        LivingDocumentationService.$inject = [
            'livingDocumentationServer', '$q', '$timeout', 'search', '$location', '$route'
        ];
        return LivingDocumentationService;
    })();
    angular.module('livingDocumentation.services', [
        'livingDocumentation.services.server', 'livingDocumentation.services.search'
    ])
        .value('version', '0.1')
        .service('livingDocumentationService', LivingDocumentationService);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="components/services.ts" />
'use strict';
angular.module('livingDocumentation', [
    'ngRoute',
    'livingDocumentation.app',
    'livingDocumentation.controllers.home',
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
/// <reference path="../../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var LivingDocumentationAppDirective = (function () {
        function LivingDocumentationAppDirective() {
            this.restrict = 'A';
            this.controller = 'LivingDocumentationApp';
            this.controllerAs = 'root';
            this.bindToController = true;
            this.templateUrl = 'components/living_documentation_app/living-documentation-app.tpl.html';
        }
        return LivingDocumentationAppDirective;
    })();
    var LivingDocumentationApp = (function () {
        function LivingDocumentationApp(livingDocService, $modal) {
            this.livingDocService = livingDocService;
            var modalInstance;
            livingDocService.onStartProcessing = function () {
                if (modalInstance) {
                    return;
                }
                modalInstance = $modal.open({ templateUrl: 'processing.html', backdrop: 'static', keyboard: false });
            };
            var this_ = this;
            livingDocService.onStopProcessing = function () {
                if (this_.isClearSearchEnabled) {
                    if (!this_.searchText) {
                        this_.toggleShowInProgressOnly(true);
                    }
                    else {
                        this_.search();
                    }
                }
                modalInstance.close();
                modalInstance = null;
            };
            this.searchText = livingDocService.searchText || '';
            livingDocService.startInitialization();
        }
        Object.defineProperty(LivingDocumentationApp.prototype, "loading", {
            get: function () { return this.livingDocService.loading; },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "error", {
            get: function () { return this.livingDocService.error; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "ready", {
            get: function () { return this.livingDocService.ready; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "isSearchEnabled", {
            get: function () { return !!this.searchText.trim(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "isClearSearchEnabled", {
            get: function () {
                return !!this.livingDocService.searchText || this.livingDocService.showInProgressOnly;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "showInProgressOnly", {
            get: function () { return this.livingDocService.showInProgressOnly; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "lastUpdatedOn", {
            get: function () {
                return _.find(this.livingDocService.documentationList, function (doc) { return !!doc.lastUpdatedOn; }).lastUpdatedOn;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationApp.prototype, "searchPart", {
            get: function () { return this.livingDocService.urlSearchPart; },
            enumerable: true,
            configurable: true
        });
        LivingDocumentationApp.prototype.search = function () {
            this.livingDocService.search(this.searchText);
        };
        LivingDocumentationApp.prototype.clearSearch = function () {
            this.livingDocService.search(null);
        };
        LivingDocumentationApp.prototype.toggleShowInProgressOnly = function (initialize) {
            this.livingDocService.toggleShowInProgressOnly(initialize);
        };
        LivingDocumentationApp.$inject = ['livingDocumentationService', '$modal'];
        return LivingDocumentationApp;
    })();
    angular.module('livingDocumentation.app', [
        'ui.bootstrap',
        'livingDocumentation.services',
        'livingDocumentation.directives',
        'livingDocumentation.documentationList',
    ])
        .directive('livingDocumentationApp', utils.wrapInjectionConstructor(LivingDocumentationAppDirective))
        .controller('LivingDocumentationApp', LivingDocumentationApp);
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
                pre: link && link.pre ? link.pre : null,
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
        return DocumentationListDirective;
    })();
    var DocumentationList = (function () {
        function DocumentationList(livingDocService) {
            this.livingDocService = livingDocService;
        }
        Object.defineProperty(DocumentationList.prototype, "documentationList", {
            get: function () { return this.livingDocService.filteredDocumentationList; },
            enumerable: true,
            configurable: true
        });
        DocumentationList.$inject = ['livingDocumentationService'];
        return DocumentationList;
    })();
    var FolderDirective = (function () {
        function FolderDirective(recursionHelper, $location) {
            var _this = this;
            this.recursionHelper = recursionHelper;
            this.$location = $location;
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
        function Folder(livingDocService) {
            this.livingDocService = livingDocService;
        }
        Object.defineProperty(Folder.prototype, "searchPart", {
            get: function () { return this.livingDocService.urlSearchPart; },
            enumerable: true,
            configurable: true
        });
        Folder.$inject = ['livingDocumentationService'];
        return Folder;
    })();
    angular.module('livingDocumentation.documentationList', [
        'livingDocumentation.services',
        'livingDocumentation.services.recursionHelper',
        'livingDocumentation.filters'
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
        return FeatureDirective;
    })();
    var Feature = (function () {
        function Feature(livingDocumentationService) {
            var _this = this;
            var doc = _.find(livingDocumentationService.filteredDocumentationList, function (doc) { return doc.definition.code === _this.documentationCode; });
            this.feature = doc.features[this.featureCode];
        }
        Object.defineProperty(Feature.prototype, "isExpanded", {
            get: function () { return this.feature.isExpanded; },
            set: function (value) {
                this.feature.isExpanded = value;
                _.each(this.feature.Feature.FeatureElements, function (s) { return s.isExpanded = value; });
                if (this.feature.Feature.Background) {
                    this.feature.Feature.Background.isExpanded = value;
                }
            },
            enumerable: true,
            configurable: true
        });
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
        return ScenarioDirective;
    })();
    var Scenario = (function () {
        function Scenario() {
        }
        return Scenario;
    })();
    var TableDirective = (function () {
        function TableDirective() {
            this.restrict = 'A';
            this.scope = {
                table: '=',
                tests: '='
            };
            this.controller = Table;
            this.controllerAs = 'ctrl';
            this.bindToController = true;
            this.templateUrl = 'components/feature/table.tpl.html';
        }
        return TableDirective;
    })();
    var Table = (function () {
        function Table() {
        }
        return Table;
    })();
    var TagsDirective = (function () {
        function TagsDirective() {
            this.restrict = 'A';
            this.scope = {
                tags: '='
            };
            this.controller = Tags;
            this.controllerAs = 'ctrl';
            this.bindToController = true;
            this.templateUrl = 'components/feature/Tags.tpl.html';
        }
        return TagsDirective;
    })();
    var Tags = (function () {
        function Tags() {
        }
        return Tags;
    })();
    angular.module('livingDocumentation.feature', [
        'ngSanitize', 'livingDocumentation.services', 'livingDocumentation.filters'
    ])
        .directive('feature', utils.wrapInjectionConstructor(FeatureDirective))
        .controller('Feature', Feature)
        .directive('scenario', utils.wrapInjectionConstructor(ScenarioDirective))
        .directive('table', utils.wrapInjectionConstructor(TableDirective))
        .directive('tags', utils.wrapInjectionConstructor(TagsDirective));
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
/// <reference path="search-service.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var NewLineFilter = (function () {
        function NewLineFilter() {
        }
        NewLineFilter.prototype.filter = function (str) {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        };
        return NewLineFilter;
    })();
    var SplitWordsFilter = (function () {
        function SplitWordsFilter() {
        }
        SplitWordsFilter.prototype.filter = function (str) {
            return livingDocumentation.splitWords(str);
        };
        return SplitWordsFilter;
    })();
    var ScenarioOutlinePlaceholderFilter = (function () {
        function ScenarioOutlinePlaceholderFilter() {
        }
        ScenarioOutlinePlaceholderFilter.prototype.filter = function (str) {
            return !str ? str : str.replace(/\&lt;([^<>]+?)\&gt;/g, function (_, c) { return ("<span class=\"text-warning\">&lt;" + c.replace(/ /g, '&nbsp;') + "&gt;</span>"); });
        };
        return ScenarioOutlinePlaceholderFilter;
    })();
    var HighlightFilter = (function () {
        function HighlightFilter(livingDocService) {
            this.livingDocService = livingDocService;
        }
        HighlightFilter.prototype.filter = function (str) {
            return !this.livingDocService.searchContext
                ? escapeHTML(str) : highlightAndEscape(this.livingDocService.searchContext.searchRegExp, str);
        };
        HighlightFilter.$inject = ['livingDocumentationService'];
        return HighlightFilter;
    })();
    var HighlightTagFilter = (function () {
        function HighlightTagFilter(livingDocService) {
            this.livingDocService = livingDocService;
        }
        HighlightTagFilter.prototype.filter = function (str) {
            return !this.livingDocService.searchContext || !_.any(this.livingDocService.searchContext.tags)
                ? escapeHTML(str)
                : highlightAndEscape(new RegExp(_.map(this.livingDocService.searchContext.tags, function (t) { return t.source; }).join('|'), 'gi'), str);
        };
        HighlightTagFilter.$inject = ['livingDocumentationService'];
        return HighlightTagFilter;
    })();
    function highlightAndEscape(regEx, str) {
        if (!str || !regEx) {
            return escapeHTML(str);
        }
        regEx.lastIndex = 0;
        var regExRes;
        var resStr = '';
        var prevLastIndex = 0;
        while ((regExRes = regEx.exec(str)) !== null) {
            resStr += escapeHTML(str.slice(prevLastIndex, regExRes.index));
            if (!regExRes[0]) {
                ++regEx.lastIndex;
            }
            else {
                resStr += "<mark>" + escapeHTML(regExRes[0]) + "</mark>";
                prevLastIndex = regEx.lastIndex;
            }
        }
        resStr += escapeHTML(str.slice(prevLastIndex, str.length));
        return resStr;
    }
    function escapeHTML(str) {
        if (!str) {
            return str;
        }
        return str.
            replace(/&/g, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;').
            replace(/'/g, '&#39;').
            replace(/"/g, '&quot;');
    }
    angular.module('livingDocumentation.filters', ['livingDocumentation.services'])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', utils.wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter))
        .filter('highlight', utils.wrapFilterInjectionConstructor(HighlightFilter))
        .filter('highlightTag', utils.wrapFilterInjectionConstructor(HighlightTagFilter));
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=main.js.map