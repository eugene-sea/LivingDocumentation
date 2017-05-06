import { Pipe, PipeTransform, Inject } from '@angular/core';

import _ from 'underscore';

import { ILivingDocumentationService } from '../living-documentation.service';

import { escapeHTML, highlightAndEscape } from './utils';

@Pipe({
  name: 'highlightTag'
})
export class HighlightTagPipe implements PipeTransform {
  constructor(
    @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
  ) { }

  transform(str: string): string {
    return !this.livingDocService.searchContext || !_.any(this.livingDocService.searchContext.tags)
      ? escapeHTML(str)
      : highlightAndEscape(
        new RegExp(_.map(this.livingDocService.searchContext.tags, t => t.source).join('|'), 'gi'), str);
  }
}
