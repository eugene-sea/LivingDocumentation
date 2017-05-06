import { Component, OnInit, Input } from '@angular/core';

import _ from 'underscore';

import { ILivingDocumentation, IFeatures, IResult } from '../../domain-model';

import { IStatistics } from '../statistics/statistics.component';

@Component({
  selector: 'ld-documentation-dashboard',
  templateUrl: './documentation-dashboard.component.html',
  styleUrls: ['./documentation-dashboard.component.css']
})
export class DocumentationDashboardComponent implements OnInit {
  @Input() documentation: ILivingDocumentation;
  iterationFeatures = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
  iterationScenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
  features = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
  scenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };

  private static isIteration(item: { Tags: string[]; }): boolean {
    return _.indexOf(item.Tags, '@iteration') !== -1;
  }

  private static processFeatures(
    features: IFeatures,
    includeItem: (item: { Tags: string[]; }) => boolean,
    featuresStatistics: IStatistics,
    scenariosStatistics: IStatistics): void {
    _.each(features, f => {
      let isFeatureIncluded = includeItem(f.Feature);
      const includedScenarios = _.filter(f.Feature.FeatureElements, s => isFeatureIncluded || includeItem(s));
      isFeatureIncluded = isFeatureIncluded || _.any(includedScenarios);
      if (isFeatureIncluded) {
        DocumentationDashboardComponent.updateStatistics(f.Feature.Result, f.isManual, featuresStatistics);
      }

      _.each(
        includedScenarios,
        s => DocumentationDashboardComponent.updateStatistics(s.Result, s.isManual, scenariosStatistics)
      );
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

  ngOnInit(): void {
    DocumentationDashboardComponent.processFeatures(
      this.documentation.features,
      DocumentationDashboardComponent.isIteration,
      this.iterationFeatures,
      this.iterationScenarios);
    DocumentationDashboardComponent.processFeatures(
      this.documentation.features, _ => true, this.features, this.scenarios);
  }
}
