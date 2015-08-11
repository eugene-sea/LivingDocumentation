/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />

'use strict';

module livingDocumentation {
    class DashboardDirective implements ng.IDirective {
        restrict = 'A';
        controller = 'Dashboard';
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/dashboard/dashboard.html';
    }

    class Dashboard {
        static $inject: string[] = ['livingDocumentationService'];

        documentationList: ILivingDocumentation[];

        constructor(livingDocumentationService: ILivingDocumentationService) {
            this.documentationList = livingDocumentationService.documentationList;
        }
    }

    class DocumentationDashboardDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            documentation: '='
        };
        controller = DocumentationDashboard;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/dashboard/documentation-dashboard.html';
    }

    interface IStatistics {
        passed: number;
        pending: number;
        failed: number;
        manual: number;
        total: number;
    }

    class DocumentationDashboard {
        documentation: ILivingDocumentation;
        iterationFeatures = { passed: 0, pending: 0, failed: 0, manual: 0, total: 0 };
        iterationScenarios = { passed: 0, pending: 0, failed: 0, manual: 0, total: 0 };
        features = { passed: 0, pending: 0, failed: 0, manual: 0, total: 0 };
        scenarios = { passed: 0, pending: 0, failed: 0, manual: 0, total: 0 };

        constructor() {
            DocumentationDashboard.processFeatures(
                this.documentation.features,
                DocumentationDashboard.isIteration,
                this.iterationFeatures,
                this.iterationScenarios);
            DocumentationDashboard.processFeatures(
                this.documentation.features, _ => true, this.features, this.scenarios);
        }

        private static isManual(item: { Tags: string[]; }): boolean {
            return _.indexOf(item.Tags, '@manual') !== -1;
        }

        private static isIteration(item: { Tags: string[]; }): boolean {
            return _.indexOf(item.Tags, '@iteration') !== -1;
        }

        private static processFeatures(
            features: IFeatures,
            includeItem: (item: { Tags: string[]; }) => boolean,
            featuresStatistics: IStatistics,
            scenariosStatistics: IStatistics): void {
            _.each(features, f => {
                let isFeatureManual = DocumentationDashboard.isManual(f.Feature);
                let isFeatureIncluded = includeItem(f.Feature);
                let includedScenarios = _.filter(f.Feature.FeatureElements, s => isFeatureIncluded || includeItem(s));
                isFeatureIncluded = isFeatureIncluded || _.any(includedScenarios);
                if (isFeatureIncluded) {
                    DocumentationDashboard.updateStatistics(f.Feature.Result, isFeatureManual, featuresStatistics);
                }

                _.each(
                    includedScenarios,
                    s => DocumentationDashboard.updateStatistics(
                        s.Result, isFeatureManual || DocumentationDashboard.isManual(s), scenariosStatistics));
            });
        }

        private static updateStatistics(result: IResult, isManual: boolean, statistics: IStatistics): void {
            ++statistics.total;
            if (isManual) {
                ++statistics.manual;
                return;
            }

            if (!result.WasExecuted) {
                ++statistics.pending;
                return;
            }

            if (!result.WasSuccessful) {
                ++statistics.failed;
                return;
            }

            ++statistics.passed;
        }
    }

    class StatisticsDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            name: '@',
            statistics: '='
        };
        controller = Statistics;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/dashboard/statistics.html';
    }

    class Statistics { }

    angular.module('livingDocumentation.controllers.dashboard', [])
        .controller('Dashboard', Dashboard)
        .directive('dashboard', utils.wrapInjectionConstructor(DashboardDirective))
        .directive('documentationDashboard', utils.wrapInjectionConstructor(DocumentationDashboardDirective))
        .directive('statistics', utils.wrapInjectionConstructor(StatisticsDirective));
}
