import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Rx';
import _ from 'underscore';

import {
  ILivingDocumentation, IFeature, ILivingDocumentationResourceDefinition, IFolder, IFeatures, IScenario
} from './domain-model';

interface IFeaturesSource {
  Features: IFeature[];
  Configuration: {
    GeneratedOn: Date;
  };
}

interface IScenarioTestSource {
  ScenarioName: string;
  Test: string;
}

interface IFeatureTestsSource {
  RelativeFolder: string;
  ScenariosTests: IScenarioTestSource[];
}

interface IFeaturesTestsSource {
  FeaturesTests: IFeatureTestsSource[];
}

interface IFeaturesExternalResults {
  [feature: string]: { [scenario: string]: string; };
}

export interface IBackendService {
  getResourceDefinitions(): Observable<ILivingDocumentationResourceDefinition[]>;
  get(resource: ILivingDocumentationResourceDefinition): Observable<ILivingDocumentation>;
}

@Injectable()
export class BackendService {
  private static findSubfolderOrCreate(parent: IFolder, childName: string): IFolder {
    let res = _.find(parent.children, c => c.name === childName);
    if (!res) {
      res = {
        children: [],
        features: [],
        name: childName
      };

      parent.children.push(res);
    }

    return res;
  }

  private static getSubfolder(parent: IFolder, folders: string[]): IFolder {
    if (!folders || folders.length === 0) {
      return parent;
    }

    const child = BackendService.findSubfolderOrCreate(parent, folders.shift());
    return BackendService.getSubfolder(child, folders);
  }

  private static parseFeatures(
    resource: ILivingDocumentationResourceDefinition,
    features: IFeature[],
    lastUpdatedOn: Date,
    featuresTests: IFeatureTestsSource[],
    externalTestResults: IFeaturesExternalResults): ILivingDocumentation {
    const root: IFolder = {
      children: [],
      features: [],
      isRoot: true,
      name: resource.name
    };

    const featuresTestsMap = featuresTests === null
      ? undefined : _.indexBy(featuresTests, f => f.RelativeFolder);

    const resFeatures: IFeatures = {};
    _.each(features, f => {
      const folders = f.RelativeFolder.match(/[^\\/]+/g);
      f.code = folders.pop();

      f.isExpanded = true;
      f.isManual = BackendService.isManual(f.Feature);
      _.each(f.Feature.FeatureElements, s => {
        s.isExpanded = true;
        BackendService.updateScenarioStatus(externalTestResults[f.Feature.Name], s);
        s.isManual = f.isManual || BackendService.isManual(s);
        s.tagsInternal = s.Tags.concat(BackendService.computeStatusTags(s));
        if (s.Examples) {
          s.Examples = (<any>s.Examples)[0];
        }
      });
      if (f.Feature.Background) {
        f.Feature.Background.isExpanded = true;
        if (f.Feature.Background.Examples) {
          f.Feature.Background.Examples = (<any>f.Feature.Background.Examples)[0];
        }
      }

      if (featuresTestsMap) {
        BackendService.addTests(f, featuresTestsMap[f.RelativeFolder], resource.testUrl);
      }

      BackendService.getSubfolder(root, folders).features.push(f);
      BackendService.updateFeatureStatus(f);
      resFeatures[f.code] = f;
    });

    return {
      definition: resource,
      features: resFeatures,
      lastUpdatedOn: new Date(lastUpdatedOn.valueOf()),
      root: root
    };
  }

  private static addTests(feature: IFeature, featureTests: IFeatureTestsSource, testUri: string): void {
    if (!featureTests) {
      return;
    }

    const scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, s => s.ScenarioName);
    _.each(feature.Feature.FeatureElements, scenario => {
      const scenarioTests = scenarioTestsMap[scenario.Name];
      if (!scenarioTests) {
        return;
      }

      scenario.tests = _.map(scenarioTests, s => (testUri || '') + s.Test);
    });
  }

  private static isManual(item: { Tags: string[]; }): boolean {
    return _.indexOf(item.Tags, '@manual') !== -1;
  }

  private static computeStatusTags(scenario: IScenario): string[] {
    if (scenario.isManual) {
      return [];
    }

    if (!scenario.Result.WasExecuted) {
      return ['@pending'];
    }

    if (!scenario.Result.WasSuccessful) {
      return ['@failing'];
    }

    return [];
  }

  private static updateScenarioStatus(
    externalTestResults: { [scenario: string]: string; }, scenario: IScenario): void {
    if (!externalTestResults) {
      return;
    }

    const scenarioTestRes = externalTestResults[scenario.Name];
    if (!scenarioTestRes) {
      return;
    }

    switch (scenarioTestRes) {
      case 'passed':
        [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [true, true];
        break;
      case 'pending':
        [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [false, false];
        break;
      case 'failed':
        [scenario.Result.WasExecuted, scenario.Result.WasSuccessful] = [true, false];
        break;
      default: throw Error();
    }
  }

  private static updateFeatureStatus(feature: IFeature): void {
    if (_.any(feature.Feature.FeatureElements, s => s.Result.WasExecuted && !s.Result.WasSuccessful)) {
      feature.Feature.Result = { WasExecuted: true, WasSuccessful: false };
      return;
    }

    if (_.any(feature.Feature.FeatureElements, s => !s.isManual && !s.Result.WasExecuted)) {
      feature.Feature.Result = { WasExecuted: false, WasSuccessful: false };
      return;
    }

    feature.Feature.Result = { WasExecuted: true, WasSuccessful: true };
  }

  constructor(private http: Http) { }

  getResourceDefinitions(): Observable<ILivingDocumentationResourceDefinition[]> {
    return this.http.get('data/configuration.json').map(res => res.json());
  }

  get(resource: ILivingDocumentationResourceDefinition): Observable<ILivingDocumentation> {
    const features = this.http.get(`data/${resource.featuresResource}`).map(res => res.json());

    const tests = !resource.testsResources
      ? Observable.of(null)
      : this.http.get(`data/${resource.testsResources}`).map(res => res.json());

    const externalResults = !resource.externalTestResults
      ? Observable.of(null)
      : this.http.get(`data/${resource.externalTestResults}`).map(res => res.json());

    return Observable.zip(features, tests, externalResults).map(
      (arr: any[]) => BackendService.parseFeatures(
        resource,
        arr[0].Features,
        arr[0].Configuration.GeneratedOn,
        !arr[1] ? null : arr[1].FeaturesTests,
        arr[2] || {}));
  }
}
