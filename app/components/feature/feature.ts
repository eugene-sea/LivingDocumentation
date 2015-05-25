/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />

'use strict';

module livingDocumentation {
    class FeatureDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        scope = {
            featureCode: '@',
            documentationCode: '@'
        };
        controller = 'Feature';
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/feature.tpl.html'
    }

    class Feature {
        static $inject: string[] = ['livingDocumentationService'];

        featureCode: string;
        documentationCode: string;
        feature: IFeature;

        constructor(livingDocumentationService: ILivingDocumentationService) {
            var doc = _.find(
                livingDocumentationService.documentationList,
                doc => doc.definition.code === this.documentationCode);

            this.feature = doc.features[this.featureCode];
        }
    }

    class ScenarioDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        scope = {
            scenario: '='
        };
        controller = Scenario;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/scenario.tpl.html'
    }

    class Scenario { }

    class TableDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        scope = {
            table: '=',
            tests: '='
        };
        controller = Table;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/table.tpl.html'
    }

    class Table { }

    angular.module('livingDocumentation.feature', [
        'ngSanitize', 'livingDocumentation.services', 'livingDocumentation.filters'
    ])
        .directive('feature', utils.wrapInjectionConstructor(FeatureDirective))
        .controller('Feature', Feature)
        .directive('scenario', utils.wrapInjectionConstructor(ScenarioDirective))
        .directive('table', utils.wrapInjectionConstructor(TableDirective));
}
