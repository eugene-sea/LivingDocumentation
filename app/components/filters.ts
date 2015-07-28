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
            return !str ? str : str.replace(/<(.*?)>/g,
                (_, c) => `<span class="text-warning">&lt${ c.replace(/ /g, '&nbsp;') }&gt</span>`);
        }
    }

    angular.module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', utils.wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter));
}
