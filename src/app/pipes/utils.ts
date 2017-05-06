export function highlightAndEscape(regEx: RegExp, str: string): string {
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

export function escapeHTML(str: string) {
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
