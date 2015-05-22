/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />

'use strict';

module livingDocumentation {
    class AppVersion implements ng.IDirective {
        public static $inject: string[] = ['version'];

        constructor(private version: string) {
            this.link = (scope, element, attributes) => this.linkCore(element);
        }

        public link: (scope: ng.IScope, element: JQuery, attributes: any) => any;

        private linkCore(element: JQuery): any {
            element.text(this.version);
        }
    }

    class IsActive implements ng.IDirective {
        public static $inject: string[] = ['$location'];

        constructor(private $location: ng.ILocationService) {
            this.link = (scope, element, attributes) => this.linkCore(scope, element, attributes);
        }

        public link: (scope: ng.IScope, element: JQuery, attributes: any) => any;

        private linkCore(scope: ng.IScope, element: JQuery, attributes: any): any {
            var handler = () => {
                var isActive: boolean;
                if (attributes['isActive']) {
                    isActive = this.$location.path().indexOf(attributes['isActive']) === 0;
                } else {
                    var indexOf = this.$location.path().indexOf(attributes['isActiveLast']);
                    isActive = indexOf >= 0 &&
                    (indexOf + attributes['isActiveLast'].length === this.$location.path().length);
                }

                if (isActive) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            };

            handler();
            IsActive.subscribe(scope, handler);
        }

        private static subscribe(scope: ng.IScope, handler: () => void): void {
            scope.$on('$routeChangeSuccess', handler);
            scope.$on('$includeContentLoaded', handler);
        }
    }

    angular
        .module('livingDocumentation.directives', [])
        .directive('appVersion', utils.wrapInjectionConstructor(AppVersion))
        .directive('isActive', utils.wrapInjectionConstructor(IsActive))
        .directive('isActiveLast', utils.wrapInjectionConstructor(IsActive));
}
