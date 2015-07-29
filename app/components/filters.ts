/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="search-service.ts" />

'use strict';

module livingDocumentation {
    class NewLineFilter implements utils.IFilter {
        filter(str: string): string {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        }
    }

    class SplitWordsFilter implements utils.IFilter {
        filter(str: string): string {
            return livingDocumentation.splitWords(str);
        }
    }

    class ScenarioOutlinePlaceholderFilter implements utils.IFilter {
        filter(str: string): string {
            return !str ? str : str.replace(/\&lt;([^<>]*?)\&gt;/g,
                (_, c) => `<span class="text-warning">&lt;${ c.replace(/ /g, '&nbsp;') }&gt;</span>`);
        }
    }

    class HighlightFilter implements utils.IFilter {
        static $inject = ['livingDocumentationService'];

        constructor(private livingDocService: ILivingDocumentationService) { }

        filter(str: string): string {
            return !this.livingDocService.searchContext
                ? escapeHTML(str) : highlightAndEscape(this.livingDocService.searchContext.searchRegExp, str);
        }
    }

    class HighlightTagFilter implements utils.IFilter {
        static $inject = ['livingDocumentationService'];

        constructor(private livingDocService: ILivingDocumentationService) { }

        filter(str: string): string {
            return !this.livingDocService.searchContext || !_.any(this.livingDocService.searchContext.tags)
                ? escapeHTML(str)
                : highlightAndEscape(
                    new RegExp(_.map(this.livingDocService.searchContext.tags, t => t.source).join('|'), 'gi'), str);
        }
    }

    function highlightAndEscape(regEx: RegExp, str: string): string {
        if (!str || !regEx) {
            return escapeHTML(str);
        }

        regEx.lastIndex = 0;
        var regExRes: RegExpExecArray;
        var resStr = '';
        var prevLastIndex = 0;
        while ((regExRes = regEx.exec(str)) !== null) {
            resStr += escapeHTML(str.slice(prevLastIndex, regExRes.index));
            resStr += `<mark>${ escapeHTML(regExRes[0]) }</mark>`;
            prevLastIndex = regEx.lastIndex;
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

    angular.module('livingDocumentation.filters', ['livingDocumentation.services'])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', utils.wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter))
        .filter('highlight', utils.wrapFilterInjectionConstructor(HighlightFilter))
        .filter('highlightTag', utils.wrapFilterInjectionConstructor(HighlightTagFilter));
}
