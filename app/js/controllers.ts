/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />

'use strict';

module livingDocumentation {
    class Home {
        public static $inject: string[] = ['$scope', 'livingDocumentationService'];

        constructor($scope: ng.IScope, livingDocumentationService: ILivingDocumentationService) { }
    }

    export var homeAnnotated = utils.wrapInjectionConstructor(Home);

    class Feature {
        public static $inject: string[] = ['$scope', '$routeParams', 'livingDocumentationService'];

        constructor(
            $scope: ng.IScope,
            $routeParams: angular.route.IRouteParamsService,
            livingDocumentationService: ILivingDocumentationService) {
            var doc = _.find(
                livingDocumentationService.documentationList,
                doc => doc.definition.code === $routeParams['documentationCode']);

            $scope['feature'] = doc.features[$routeParams['featureCode']];
        }
    }

    export var featureAnnotated = utils.wrapInjectionConstructor(Feature);
}

angular.module('livingDocumentation.controllers', ['livingDocumentation.services'])
    .controller('Home', livingDocumentation.homeAnnotated)
    .controller('Feature', livingDocumentation.featureAnnotated);
