import { Injectable } from 'angular2/core';

import { ILivingDocumentation, IFolder, IFeatures, IFeature, IScenario, IStep, ITable } from '../domain-model';

export interface ISearchContext {
    tags: RegExp[];
    searchRegExp: RegExp;
}

export interface ISearchService {
    search(searchText: string, documentationList: ILivingDocumentation[]):
        { documentationList: ILivingDocumentation[]; searchContext: ISearchContext; };
}

export function splitWords(str: string): string {
    let res = str[0];
    for (let i = 1; i < str.length; ++i) {
        let prev = str[i - 1], cur = str[i], next = i < str.length - 1 ? str[i] : null;

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
    let tagRegEx = /(@[^\s]+)(\s|$)/g;
    let regExRes: RegExpExecArray;
    let resStr = '';
    let resTags: RegExp[] = [];
    let prevLastIndex = 0;
    while (true) {
        regExRes = tagRegEx.exec(searchText);
        if (regExRes === null) {
            break;
        }

        resStr += searchText.slice(prevLastIndex, regExRes.index);
        resTags.push(new RegExp(regExRes[1], 'i'));
        prevLastIndex = tagRegEx.lastIndex;
    }

    resStr += searchText.slice(prevLastIndex, searchText.length);
    resStr = resStr.trim();

    return { searchRegExp: resStr ? new RegExp(resStr, 'gi') : null, tags: resTags };
}

function isTextPresentInDocumentation(
    searchContext: ISearchContext, doc: ILivingDocumentation): ILivingDocumentation {
    let root = isTextPresentInFolder(searchContext, doc.root);
    if (!root) {
        return null;
    }

    let features: IFeatures = {};
    addFeatures(root, features);
    return {
        definition: doc.definition,
        features: features,
        lastUpdatedOn: doc.lastUpdatedOn,
        root: root
    };
}

function isTextPresentInFolder(searchContext: ISearchContext, folder: IFolder): IFolder {
    let isTextPresentInTitle = !folder.isRoot && !_.any(searchContext.tags) &&
        isTextPresent(searchContext, splitWords(folder.name));
    let features = _.filter(_.map(folder.features, f => isTextPresentInFeature(searchContext, f)), f => !!f);
    let folders = _.filter(_.map(folder.children, f => isTextPresentInFolder(searchContext, f)), f => !!f);
    if (!isTextPresentInTitle && !_.any(features) && !_.any(folders)) {
        return null;
    }

    return {
        children: folders,
        features: features,
        isRoot: folder.isRoot,
        name: folder.name
    };
}

function isTextPresentInFeature(searchContext: ISearchContext, feature: IFeature): IFeature {
    let tagsScenariosMap = _.map(searchContext.tags, t => isTagPresentInFeature(t, feature));

    if (_.any(tagsScenariosMap, a => a === null)) {
        return null;
    }

    let tagsScenarios = _.union(...tagsScenariosMap);

    let isTextPresentInTitle = isTextPresent(searchContext, feature.Feature.Name);

    let isTextPresentInDescription = isTextPresent(searchContext, feature.Feature.Description);

    let isTextPresentInBackground = feature.Feature.Background &&
        isTextPresentInScenario(searchContext, feature.Feature.Background);

    // Intersection is made to preserve original order between scenarios
    let scenarios = !_.any(searchContext.tags)
        ? feature.Feature.FeatureElements : _.intersection(feature.Feature.FeatureElements, tagsScenarios);

    scenarios = _.filter(scenarios, s => isTextPresentInScenario(searchContext, s));
    if (!isTextPresentInTitle && !isTextPresentInDescription && !isTextPresentInBackground && !_.any(scenarios)) {
        return null;
    }

    return {
        Feature: {
            Background: !isTextPresentInBackground ? null : feature.Feature.Background,
            Description: feature.Feature.Description,
            FeatureElements: scenarios,
            Name: feature.Feature.Name,
            Result: feature.Feature.Result,
            Tags: feature.Feature.Tags
        },
        RelativeFolder: feature.RelativeFolder,
        code: feature.code,
        get isExpanded() { return feature.isExpanded; },
        set isExpanded(value: boolean) { feature.isExpanded = value; },
        isManual: feature.isManual
    };
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

    return isTextPresent(searchContext, step.Name) || isTextPresent(searchContext, step.DocStringArgument);
}

function isTagPresentInFeature(tag: RegExp, feature: IFeature): IScenario[] {
    if (_.any(feature.Feature.Tags, t => isTextPresentRegEx(tag, t))) {
        return feature.Feature.FeatureElements;
    }

    let scenarios = _.filter(
        feature.Feature.FeatureElements, s => _.any(s.tagsInternal, t => isTextPresentRegEx(tag, t)));
    return !_.any(scenarios) ? null : scenarios;
}

function addFeatures(folder: IFolder, features: IFeatures) {
    _.each(_.sortBy(folder.children, f => f.name), f => addFeatures(f, features));
    _.each(_.sortBy(folder.features, f => f.Feature.Name), f => features[f.code] = f);
}

@Injectable()
export default class SearchService implements ISearchService {
    search(searchText: string, documentationList: ILivingDocumentation[]):
        { documentationList: ILivingDocumentation[]; searchContext: ISearchContext; } {
        let searchContext = getSearchContext(searchText);
        documentationList = _.filter(
            _.map(documentationList, d => isTextPresentInDocumentation(searchContext, d)), d => !!d);
        documentationList = _.sortBy(documentationList, d => d.definition.sortOrder);
        return {
            documentationList: documentationList,
            searchContext: searchContext
        };
    }
}
