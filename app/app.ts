/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="components/services.ts" />

'use strict';

angular.module('livingDocumentation', [
    'ngRoute',
    'livingDocumentation.app',
    'livingDocumentation.controllers.dashboard',
    'livingDocumentation.feature'
]).config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    const resolve: { [key: string]: any; } = {
        livingDocumentationServiceReady: [
            'livingDocumentationService',
            (service: livingDocumentation.ILivingDocumentationService) => service.resolve
        ]
    };

    $routeProvider.when('/dashboard', {
        resolve: resolve,
        template: '<div dashboard></div>'
    });

    $routeProvider.when('/feature/:documentationCode/:featureCode', {
        resolve: resolve,
        template: ($routeParams: angular.route.IRouteParamsService) =>
            `<div feature
                feature-code="${$routeParams['featureCode']}"
                documentation-code="${$routeParams['documentationCode']}">
             </div>`
    });

    $routeProvider.otherwise({ redirectTo: '/dashboard' });
}]);
