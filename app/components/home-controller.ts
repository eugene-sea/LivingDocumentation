/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />

'use strict';

module livingDocumentation {
    class HomeDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        controller = Home;
        controllerAs = 'home';
        bindToController = true;
        template = '';
    }

    class Home { }

    angular.module('livingDocumentation.controllers.home', [])
        .directive('home', utils.wrapInjectionConstructor(HomeDirective));
}
