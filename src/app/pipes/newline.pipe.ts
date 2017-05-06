import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'newline'
})
export class NewlinePipe implements PipeTransform {
  transform(str: string): string {
    return !str ? str : str.replace(/\r\n/mg, '<br>');
  }
}
