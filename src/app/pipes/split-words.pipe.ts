import { Pipe, PipeTransform } from '@angular/core';

import { splitWords } from '../search.service';

@Pipe({
  name: 'splitWords'
})
export class SplitWordsPipe implements PipeTransform {
  transform(str: string): string {
    return splitWords(str);
  }
}
