import { Pipe, PipeTransform, Inject } from 'angular2/core';

import { ILivingDocumentationService } from './living-documentation-service';
import { splitWords } from './search-service';

@Pipe({ name: 'newline' })
export class NewLinePipe implements PipeTransform {
    transform(str: string): string {
        return !str ? str : str.replace(/\r\n/mg, '<br />');
    }
}

@Pipe({ name: 'splitWords' })
export class SplitWordsFilter implements PipeTransform {
    transform(str: string): string {
        return splitWords(str);
    }
}

@Pipe({ name: 'scenarioOutlinePlaceholder' })
export class ScenarioOutlinePlaceholderPipe implements PipeTransform {
    transform(str: string): string {
        return !str ? str : str.replace(
            /\&lt;([^<>]+?)\&gt;/g,
            (_, c) => `<span class="text-warning">&lt;${c.replace(/ /g, '&nbsp;')}&gt;</span>`);
    }
}

@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
    ) { }

    transform(str: string): string {
        return !this.livingDocService.searchContext
            ? escapeHTML(str) : highlightAndEscape(this.livingDocService.searchContext.searchRegExp, str);
    }
}

@Pipe({ name: 'highlightTag' })
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

@Pipe({ name: 'widen' })
export class WidenPipe implements PipeTransform {
    transform(str: string): string {
        return widen(str);
    }
}

function highlightAndEscape(regEx: RegExp, str: string): string {
    if (!str || !regEx) {
        return escapeHTML(str);
    }

    regEx.lastIndex = 0;
    let regExRes: RegExpExecArray;
    let resStr = '';
    let prevLastIndex = 0;
    while (true) {
        regExRes = regEx.exec(str);
        if (regExRes === null) {
            break;
        }

        resStr += escapeHTML(str.slice(prevLastIndex, regExRes.index));
        if (!regExRes[0]) {
            ++regEx.lastIndex;
        } else {
            resStr += `<mark>${escapeHTML(regExRes[0])}</mark>`;
            prevLastIndex = regEx.lastIndex;
        }
    }

    resStr += escapeHTML(str.slice(prevLastIndex, str.length));
    return resStr;
}

function escapeHTML(str: string) {
    if (!str) {
        return '';
    }

    return str.
        replace(/&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;').
        replace(/'/g, '&#39;').
        replace(/"/g, '&quot;');
}

export function widen(str: string): string {
    let i = 1;
    return str.replace(/ /g, () => i++ % 3 === 0 ? ' ' : '&nbsp;');
}
