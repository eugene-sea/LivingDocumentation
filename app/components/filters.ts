/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />

'use strict';

module livingDocumentation {
    class NewLineFilter implements utils.IFilter {
        static $inject: string[] = [];

        filter(str: string): string {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        }
    }

    class SplitWordsFilter implements utils.IFilter {
        static $inject: string[] = [];

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

    angular.module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter))
        .filter('splitWords', utils.wrapFilterInjectionConstructor(SplitWordsFilter));
}
