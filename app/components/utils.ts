export function wrapInjectionConstructor<T>(
    constructor: { $inject?: string[]; }, transformer?: (inst: T) => any): any {
    return (<any[]>constructor.$inject || []).concat(
        function() {
            const functionConstructor = (<Function><any>constructor).bind.apply(
                constructor, [<any>null].concat(Array.prototype.slice.call(arguments, 0)));

            const res = <T>new functionConstructor();
            return !transformer ? res : transformer(res);
        });
}

export function format(format: string, ...args: string[]): string {
    return format.replace(/{(\d+)}/g, (match, index) => {
        return typeof args[index] !== 'undefined'
            ? args[index]
            : match;
    });
}
