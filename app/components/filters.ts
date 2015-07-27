/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />

'use strict';

module livingDocumentation {
    class NewLineFilter implements utils.IFilter {
        filter(str: string): string {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        }
    }

    class SplitWordsFilter implements utils.IFilter {
        filter(str: string): string {
            var res = str[0];
            for (var i = 1; i < str.length; ++i) {
                var prev = str[i - 1], cur = str[i], next = i < str.length - 1 ? str[i] : null;

                if (!SplitWordsFilter.isUpperCase(prev)) {
                    if (prev !== ' ' && SplitWordsFilter.isUpperCase(cur)) {
                        res += ' ';
                    }
                } else if (SplitWordsFilter.isUpperCase(cur) && next && !SplitWordsFilter.isUpperCase(next)) {
                    res += ' ';
                }

                res += cur;
            }

            return res;
        }

        private static isUpperCase(s: string): boolean {
            return s === s.toUpperCase() && s !== s.toLowerCase();
        }
    }


    class ScenarioOutlinePlaceholderFilter implements utils.IFilter {
        filter(str: string): string {
            return !str ? str : str.replace(/<(.*?)>/g,
                (_, c) => `<span class="text-warning">&lt${c.replace(/ /g, '&nbsp;')}&gt</span>`);
        }
    }

    angular.module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter))
        .filter('scenarioOutlinePlaceholder', utils.wrapFilterInjectionConstructor(ScenarioOutlinePlaceholderFilter));
}
