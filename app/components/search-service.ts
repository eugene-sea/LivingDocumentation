/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../domain-model.ts" />

'use strict';

module livingDocumentation {
    export interface ISearchContext {
        tags: RegExp[];
        searchRegExp: RegExp;
    }

    export interface ISearchService {
        search(searchText: string, documentationList: ILivingDocumentation[]):
            { documentationList: ILivingDocumentation[]; searchContext: ISearchContext; };
    }

    export function splitWords(str: string): string {
        var res = str[0];
        for (var i = 1; i < str.length; ++i) {
            var prev = str[i - 1], cur = str[i], next = i < str.length - 1 ? str[i] : null;

            if (!isUpperCase(prev)) {
                if (prev !== ' ' && isUpperCase(cur)) {
                    res += ' ';
                }
            } else if (isUpperCase(cur) && next && !isUpperCase(next)) {
                res += ' ';
            }

            res += cur;
        }

        return res;
    }

    function isUpperCase(s: string): boolean {
        return s === s.toUpperCase() && s !== s.toLowerCase();
    }

    function isTextPresent({ searchRegExp }: ISearchContext, str: string): boolean {
        return !searchRegExp || (str && str.search(searchRegExp) >= 0);
    }

    function isTextPresentRegEx(regEx: RegExp, str: string): boolean {
        return str && str.search(regEx) >= 0;
    }

    function getSearchContext(searchText: string): ISearchContext {
        searchText = searchText || '';
        var tagRegEx = /(@[^\s]+)(\s|$)/g;
        var regExRes: RegExpExecArray;
        var resStr = '';
        var resTags: RegExp[] = [];
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

    function isTextPresentInDocumentation(
        searchContext: ISearchContext, doc: ILivingDocumentation): ILivingDocumentation {
        var root = isTextPresentInFolder(searchContext, doc.root);
        if (!root) {
            return null;
        }

        return {
            definition: doc.definition,
            root: root,
            features: doc.features,
            lastUpdatedOn: doc.lastUpdatedOn
        };
    }

    function isTextPresentInFolder(searchContext: ISearchContext, folder: IFolder): IFolder {
        var isTextPresentInTitle = !folder.isRoot && !_.any(searchContext.tags) &&
            isTextPresent(searchContext, splitWords(folder.name));
        var features = _.filter(folder.features, f => isTextPresentInFeature(searchContext, f));
        var folders = _.filter(_.map(folder.children, f => isTextPresentInFolder(searchContext, f)), f => !!f);
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

    function isTextPresentInFeature(searchContext: ISearchContext, feature: IFeature): boolean {
        if (!_.all(searchContext.tags, t => isTagPresentInFeature(t, feature))) {
            return false;
        }

        if (isTextPresent(searchContext, feature.Feature.Name)) {
            return true;
        }

        if (isTextPresent(searchContext, feature.Feature.Description)) {
            return true;
        }

        if (feature.Feature.Background && isTextPresentInScenario(searchContext, feature.Feature.Background)) {
            return true;
        }

        return _.any(feature.Feature.FeatureElements, s => isTextPresentInScenario(searchContext, s));
    }

    function isTextPresentInScenario(searchContext: ISearchContext, scenario: IScenario): boolean {
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

        return _.any(scenario.Steps, s => isTextPresentInStep(searchContext, s));
    }

    function isTextPresentInTable(searchContext: ISearchContext, table: ITable): boolean {
        if (_.any(table.HeaderRow, s => isTextPresent(searchContext, s))) {
            return true;
        }

        return _.any(table.DataRows, r => _.any(r, s => isTextPresent(searchContext, s)));
    }

    function isTextPresentInStep(searchContext: ISearchContext, step: IStep): boolean {
        if (step.TableArgument && isTextPresentInTable(searchContext, step.TableArgument)) {
            return true;
        }

        return isTextPresent(searchContext, step.Name);
    }

    function isTagPresentInFeature(tag: RegExp, feature: IFeature): boolean {
        if (_.any(feature.Feature.Tags, t => isTextPresentRegEx(tag, t))) {
            return true;
        }

        return _.any(feature.Feature.FeatureElements, s => _.any(s.Tags, t => isTextPresentRegEx(tag, t)));
    }

    class SearchService implements ISearchService {
        search(searchText: string, documentationList: ILivingDocumentation[]):
            { documentationList: ILivingDocumentation[]; searchContext: ISearchContext; } {
            var searchContext = getSearchContext(searchText);
            return {
                documentationList: _.filter(
                    _.map(documentationList, d => isTextPresentInDocumentation(searchContext, d)), d => !!d),
                searchContext: searchContext
            };
        }
    }

    angular.module('livingDocumentation.services.search', [])
        .service('search', SearchService);
}
