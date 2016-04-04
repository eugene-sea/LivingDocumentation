import { ILivingDocumentationService } from './services';
import { splitWords } from './search-service';
import { IFilter, wrapFilterInjectionConstructor } from './utils';

class NewLineFilter implements IFilter {
    filter(str: string): string {
        return !str ? str : str.replace(/\r\n/mg, '<br />');
    }
}

class SplitWordsFilter implements IFilter {
    filter(str: string): string {
        return splitWords(str);
    }
}

class ScenarioOutlinePlaceholderFilter implements IFilter {
    filter(str: string): string {
        return !str ? str : str.replace(
            /\&lt;([^<>]+?)\&gt;/g,
            (_, c) => `<span class="text-warning">&lt;${c.replace(/ /g, '&nbsp;')}&gt;</span>`);
    }
}

class HighlightFilter implements IFilter {
    static $inject = ['livingDocumentationService'];

    constructor(private livingDocService: ILivingDocumentationService) { }

    filter(str: string): string {
        return !this.livingDocService.searchContext
            ? escapeHTML(str) : highlightAndEscape(this.livingDocService.searchContext.searchRegExp, str);
    }
}

class HighlightTagFilter implements IFilter {
    static $inject = ['livingDocumentationService'];

    constructor(private livingDocService: ILivingDocumentationService) { }

    filter(str: string): string {
        return !this.livingDocService.searchContext || !_.any(this.livingDocService.searchContext.tags)
            ? escapeHTML(str)
            : highlightAndEscape(
                new RegExp(_.map(this.livingDocService.searchContext.tags, t => t.source).join('|'), 'gi'), str);
    }
}

class WidenFilter implements IFilter {
    filter(str: string): string {
        return widen(str);
    }
}

function highlightAndEscape(regEx: RegExp, str: string): string {
    if (!str || !regEx) {
        return escapeHTML(str);
    }

    regEx.lastIndex = 0;
    let regExRes: RegExpExecArray;
    let resStr = '';
    let prevLastIndex = 0;
    while (true) {
        regExRes = regEx.exec(str);
        if (regExRes === null) {
            break;
        }

        resStr += escapeHTML(str.slice(prevLastIndex, regExRes.index));
        if (!regExRes[0]) {
            ++regEx.lastIndex;
        } else {
            resStr += `<mark>${escapeHTML(regExRes[0])}</mark>`;
            prevLastIndex = regEx.lastIndex;
        }
    }

    resStr += escapeHTML(str.slice(prevLastIndex, str.length));
    return resStr;
}

function escapeHTML(str: string) {
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

export function widen(str: string): string {
    let i = 1;
    return str.replace(/ /g, () => i++ % 3 === 0 ? ' ' : '&nbsp;');
}

if (typeof angular !== 'undefined') {
    angular.module('livingDocumentation.filters', ['livingDocumentation.services'])
        .filter('newline', wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter))
        .filter('highlight', wrapFilterInjectionConstructor(HighlightFilter))
        .filter('highlightTag', wrapFilterInjectionConstructor(HighlightTagFilter))
        .filter('widen', wrapFilterInjectionConstructor(WidenFilter));
}
