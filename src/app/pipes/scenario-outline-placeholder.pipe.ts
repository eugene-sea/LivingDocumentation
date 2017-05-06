import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scenarioOutlinePlaceholder'
})
export class ScenarioOutlinePlaceholderPipe implements PipeTransform {
  transform(str: string): string {
    return !str ? str : str.replace(
      /\&lt;([^<>]+?)\&gt;/g,
      (_, c) => `<span class="text-warning">&lt;${c.replace(/ /g, '&nbsp;')}&gt;</span>`);
  }
}
