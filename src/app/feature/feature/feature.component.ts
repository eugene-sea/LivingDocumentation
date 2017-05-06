import { Component, OnInit, Input, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import _ from 'underscore';

import { ILivingDocumentation, IFeature } from '../../domain-model';
import { ILivingDocumentationService } from '../../living-documentation.service';
import { format } from '../../util';

@Component({
  selector: 'ld-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.css']
})
export class FeatureComponent implements OnInit {
  documentationCode: Observable<string>;
  featureCode: Observable<string>;
  feature: Observable<IFeature[]>;
  documentation: ILivingDocumentation;
  featureEditUrl: string;

  private featureInner: IFeature;

  constructor(
    @Inject('livingDocumentationService') private livingDocumentationService: ILivingDocumentationService,
    activatedRoute: ActivatedRoute
  ) {
    this.documentationCode = activatedRoute.params.pluck('documentationCode');
    this.featureCode = activatedRoute.params.pluck('featureCode');
  }

  ngOnInit(): void {
    let documentationCode: string;
    let featureCode: string;
    this.feature = Observable.combineLatest(
      this.livingDocumentationService.filteredDocumentationListObservable,
      this.documentationCode,
      this.featureCode
    )
      .map(a => {
        let list: ILivingDocumentation[];
        [list, documentationCode, featureCode] = a;
        return list;
      })
      .map(l => _.find(l, doc => doc.definition.code === documentationCode))
      .filter(d => d != null)
      .map(d => {
        this.documentation = d;
        this.featureInner = this.documentation.features[featureCode];

        if (!this.featureInner) {
          return [];
        }

        if (this.documentation.definition.featureEditUrl) {
          this.featureEditUrl = format(
            this.documentation.definition.featureEditUrl,
            this.featureInner.RelativeFolder.replace(/\\/g, '/')
          );
        }

        return [this.featureInner];
      });
  }

  get isExpanded(): boolean { return this.featureInner && this.featureInner.isExpanded; }
  set isExpanded(value: boolean) {
    this.featureInner.isExpanded = value;
    _.each(this.featureInner.Feature.FeatureElements, s => s.isExpanded = value);
    if (this.featureInner.Feature.Background) {
      this.featureInner.Feature.Background.isExpanded = value;
    }
  }
}
