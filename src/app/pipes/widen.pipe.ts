import { Pipe, PipeTransform } from '@angular/core';

import { widen } from './utils';

@Pipe({
  name: 'widen'
})
export class WidenPipe implements PipeTransform {
  transform(str: string): string {
    return widen(str);
  }
}
