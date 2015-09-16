'use strict';

module utils {
    export function wrapInjectionConstructor<T>(
        constructor: { $inject?: string[]; }, transformer?: (inst: T) => any): any {
        return (<any[]>constructor.$inject || []).concat(
            function() {
                var functionConstructor = (<Function><any>constructor).bind.apply(
                    constructor, [<any>null].concat(Array.prototype.slice.call(arguments, 0)));

                var res = <T>new functionConstructor();
                return !transformer ? res : transformer(res);
            });
    }

    export interface IFilter {
        filter(item: any): string;
    }

    export function wrapFilterInjectionConstructor<T>(constructor: { $inject?: string[]; }) {
        return utils.wrapInjectionConstructor(constructor, (f: IFilter) => {
            return f.filter.bind(f);
        });
    }

    export function format(format: string, ...args: string[]): string {
        return format.replace(/{(\d+)}/g, (match, index) => {
            return typeof args[index] !== 'undefined'
                ? args[index]
                : match;
        });
    }
}
