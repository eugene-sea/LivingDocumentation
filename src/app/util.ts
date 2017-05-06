export function format(format: string, ...args: string[]): string {
  return format.replace(/{(\d+)}/g, (match, index) => {
    return typeof args[index] !== 'undefined'
      ? args[index]
      : match;
  });
}
