/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="components/services.ts" />

'use strict';

angular.module('livingDocumentation', [
    'ngRoute',
    'livingDocumentation.app',
    'livingDocumentation.controllers.home',
    'livingDocumentation.feature',
]).config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    var resolve: { [key: string]: any; } = {
        livingDocumentationServiceReady: [
            'livingDocumentationService',
            (service: livingDocumentation.ILivingDocumentationService) => service.resolve
        ]
    };

    $routeProvider.when('/home', {
        template: '<div home></div>',
        resolve: resolve
    });

    $routeProvider.when('/feature/:documentationCode/:featureCode', {
        template: ($routeParams: angular.route.IRouteParamsService) =>
            `<div feature
                feature-code="${$routeParams['featureCode']}"
                documentation-code="${$routeParams['documentationCode']}">
             </div>`,
        resolve: resolve
    });

    $routeProvider.otherwise({ redirectTo: '/home' });
}]);
