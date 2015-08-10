/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />

'use strict';

module livingDocumentation {
    class FeatureDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            featureCode: '@',
            documentationCode: '@'
        };
        controller = 'Feature';
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/feature.tpl.html';
    }

    class Feature {
        static $inject: string[] = ['livingDocumentationService'];

        featureCode: string;
        documentationCode: string;
        documentation: ILivingDocumentation;
        feature: IFeature;
        featureEditUri: string;

        constructor(livingDocumentationService: ILivingDocumentationService) {
            this.documentation = _.find(
                livingDocumentationService.filteredDocumentationList,
                doc => doc.definition.code === this.documentationCode);

            this.feature = this.documentation.features[this.featureCode];
            if (this.documentation.definition.featureEditUri) {
                this.featureEditUri = utils.format(
                    this.documentation.definition.featureEditUri, this.feature.RelativeFolder.replace(/\\/g, '/'));
            }
        }

        get isExpanded(): boolean { return this.feature.isExpanded; }
        set isExpanded(value: boolean) {
            this.feature.isExpanded = value;
            _.each(this.feature.Feature.FeatureElements, s => s.isExpanded = value);
            if (this.feature.Feature.Background) {
                this.feature.Feature.Background.isExpanded = value;
            }
        }
    }

    class ScenarioDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            documentation: '=',
            scenario: '='
        };
        controller = Scenario;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/scenario.tpl.html';
    }

    class Scenario { }

    class TableDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            table: '=',
            tests: '='
        };
        controller = Table;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/table.tpl.html';
    }

    class Table { }

    class TagsDirective implements ng.IDirective {
        restrict = 'A';
        scope = {
            documentation: '=',
            tags: '='
        };
        controller = Tags;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/feature/Tags.tpl.html';
    }

    class Tags {
        documentation: ILivingDocumentation;

        getIssueTrackingUri(tag: string): string {
            var match = new RegExp(this.documentation.definition.issueTrackingRegExp, 'i').exec(tag);
            return match === null ? null : utils.format(this.documentation.definition.issueTrackingUri, ...match);
        }
    }

    angular.module('livingDocumentation.feature', [
        'ngSanitize', 'livingDocumentation.services', 'livingDocumentation.filters'
    ])
        .directive('feature', utils.wrapInjectionConstructor(FeatureDirective))
        .controller('Feature', Feature)
        .directive('scenario', utils.wrapInjectionConstructor(ScenarioDirective))
        .directive('table', utils.wrapInjectionConstructor(TableDirective))
        .directive('tags', utils.wrapInjectionConstructor(TagsDirective));
}
