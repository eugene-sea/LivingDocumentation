/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />

'use strict';

module livingDocumentation {
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

    angular.module('livingDocumentation.controllers', ['livingDocumentation.services'])
        .controller('Feature', Feature);
}
