/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="js/services.ts" />

'use strict';

angular.module('livingDocumentation', [
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'livingDocumentation.filters',
    'livingDocumentation.services',
    'livingDocumentation.directives',
    'livingDocumentation.controllers'
]).config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    var resolve: { [key: string]: any; } = {
        livingDocumentationServiceReady: [
            'livingDocumentationService',
            (service: livingDocumentation.ILivingDocumentationService) => service.resolve
        ]
    };

    $routeProvider.when('/home', {
        templateUrl: 'partials/home.html',
        controller: 'Home',
        resolve: resolve
    });

    $routeProvider.when('/feature/:documentationCode/:featureCode', {
        templateUrl: 'partials/feature.html',
        controller: 'Feature',
        resolve: resolve
    });

    $routeProvider.otherwise({ redirectTo: '/home' });
}]);
