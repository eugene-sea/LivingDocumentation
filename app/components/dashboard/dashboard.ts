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
        total: number;
    }

    class DocumentationDashboard {
        documentation: ILivingDocumentation;
        features = { passed: 0, pending: 0, failed: 0, total: 0 };
        scenarios = { passed: 0, pending: 0, failed: 0, total: 0 };

        constructor() {
            _.each(this.documentation.features, f => {
                DocumentationDashboard.updateStatistics(f.Feature.Result, this.features);
                _.each(
                    f.Feature.FeatureElements, s => DocumentationDashboard.updateStatistics(s.Result, this.scenarios));
            })
        }

        private static updateStatistics(result: IResult, statistics: IStatistics): void {
            ++statistics.total;
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

    angular.module('livingDocumentation.controllers.dashboard', [])
        .controller('Dashboard', Dashboard)
        .directive('dashboard', utils.wrapInjectionConstructor(DashboardDirective))
        .directive('documentationDashboard', utils.wrapInjectionConstructor(DocumentationDashboardDirective));
}
