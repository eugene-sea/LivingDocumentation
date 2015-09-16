/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="search-service.ts" />
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
    var WidenFilter = (function () {
        function WidenFilter() {
        }
        WidenFilter.prototype.filter = function (str) {
            return widen(str);
        };
        return WidenFilter;
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
    function widen(str) {
        var i = 1;
        return str.replace(/ /g, function () { return i++ % 3 === 0 ? ' ' : '&nbsp;'; });
    }
    livingDocumentation.widen = widen;
    angular.module('livingDocumentation.filters', ['livingDocumentation.services'])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', utils.wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter))
        .filter('highlight', utils.wrapFilterInjectionConstructor(HighlightFilter))
        .filter('highlightTag', utils.wrapFilterInjectionConstructor(HighlightTagFilter))
        .filter('widen', utils.wrapFilterInjectionConstructor(WidenFilter));
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=filters.js.map