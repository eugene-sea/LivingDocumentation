import { Component, Input, Inject } from '@angular/core';

import _ from 'underscore';

import { ILivingDocumentationService } from '../../living-documentation.service';
import { ILivingDocumentation } from '../../domain-model';

@Component({
  selector: 'ld-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.css']
})
export class TagListComponent {
  @Input() documentation: ILivingDocumentation;

  constructor(
    @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
  ) { }

  get tags(): string[] {
    return _.sortBy(
      _.uniq(
        _.flatten(_.map(
          this.documentation.features,
          f => f.Feature.Tags.concat(
            f.Feature.Background ? f.Feature.Background.Tags : [],
            _.flatten(f.Feature.FeatureElements.map(fe => fe.Tags))
          )
        ))
      ),
      _.identity
    );
  }
}
