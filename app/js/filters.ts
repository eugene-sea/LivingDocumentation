/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />

'use strict';

module livingDocumentation {
    class NewLineFilter implements utils.IFilter {
        public static $inject: string[] = [];

        constructor() { }

        public filter(str: string): string {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        }
    }

    angular
        .module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter));
}
