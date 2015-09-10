/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />
/// <reference path="utils.ts" />
/// <reference path="living-documentation-server.ts" />
/// <reference path="search-service.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    (function (DocumentationFilter) {
        DocumentationFilter[DocumentationFilter["InProgress"] = 0] = "InProgress";
        DocumentationFilter[DocumentationFilter["Pending"] = 1] = "Pending";
        DocumentationFilter[DocumentationFilter["Failed"] = 2] = "Failed";
        DocumentationFilter[DocumentationFilter["Manual"] = 3] = "Manual";
    })(livingDocumentation.DocumentationFilter || (livingDocumentation.DocumentationFilter = {}));
    var DocumentationFilter = livingDocumentation.DocumentationFilter;
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
                return "" + (!this.searchText ? '' : "?search=" + encodeURIComponent(this.searchText || '')) + (this.filter == null ? '' : "&showOnly=" + this.filterRaw);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationService.prototype, "filter", {
            get: function () { return !this.filterRaw ? null : DocumentationFilter[this.filterRaw]; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LivingDocumentationService.prototype, "filterRaw", {
            get: function () { return this.$location.search().showOnly; },
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
                this.$location.search('showOnly', null);
                _a = [this.documentationList, null, null], this.filteredDocumentationList = _a[0], this.searchContext = _a[1], this.currentSearchText = _a[2];
                return;
            }
            this.searchCore();
            var _a;
        };
        LivingDocumentationService.prototype.showOnly = function (filter, initialize) {
            if (!initialize) {
                this.$location.search('showOnly', DocumentationFilter[filter]);
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
            var searchText;
            switch (this.filter) {
                case DocumentationFilter.InProgress:
                    searchText = '@iteration ';
                    break;
                case DocumentationFilter.Pending:
                    searchText = '@pending ';
                    break;
                case DocumentationFilter.Failed:
                    searchText = '@failing ';
                    break;
                case DocumentationFilter.Manual:
                    searchText = '@manual ';
                    break;
                default:
                    searchText = '';
            }
            searchText += this.searchText || '';
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
                this.$location.path('/dashboard');
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
        .value('version', '0.9')
        .service('livingDocumentationService', LivingDocumentationService);
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=services.js.map