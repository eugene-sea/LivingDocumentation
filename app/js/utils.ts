'use strict';

module utils {
    export function wrapInjectionConstructor<T>(
        constructor: { $inject: string[]; }, transformer?: (inst: T) => any): any {
        return (<any[]>constructor.$inject).concat(
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

    export function wrapFilterInjectionConstructor<T>(constructor: { $inject: string[]; new (...params: any[]): T; }) {
        return utils.wrapInjectionConstructor(constructor, (f: IFilter) => {
            return f.filter.bind(f);
        });
    }
}
