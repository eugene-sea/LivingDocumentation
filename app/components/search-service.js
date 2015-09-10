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
            isManual: feature.isManual,
            RelativeFolder: feature.RelativeFolder,
            Feature: {
                Name: feature.Feature.Name,
                Description: feature.Feature.Description,
                Tags: feature.Feature.Tags,
                Background: !isTextPresentInBackground ? null : feature.Feature.Background,
                FeatureElements: scenarios,
                Result: feature.Feature.Result
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
        var scenarios = _.filter(feature.Feature.FeatureElements, function (s) { return _.any(s.tagsInternal, function (t) { return isTextPresentRegEx(tag, t); }); });
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
//# sourceMappingURL=search-service.js.map