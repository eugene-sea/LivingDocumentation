import { Pipe, PipeTransform, Inject } from '@angular/core';

import { ILivingDocumentationService } from '../living-documentation.service';

import { escapeHTML, highlightAndEscape } from './utils';

@Pipe({
  name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
  constructor(
    @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
  ) { }

  transform(str: string): string {
    return !this.livingDocService.searchContext
      ? escapeHTML(str) : highlightAndEscape(this.livingDocService.searchContext.searchRegExp, str);
  }
}
