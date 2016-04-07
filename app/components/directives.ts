import { wrapInjectionConstructor } from './utils';

class AppVersion implements ng.IDirective {
    public static $inject: string[] = ['version'];

    constructor(private version: string) {
        this.link = (scope, element, attributes) => this.linkCore(element);
    }

    public link: (scope: ng.IScope, element: JQuery, attributes: any) => any;

    private linkCore(element: JQuery): any {
        element.text(this.version);
    }
}

angular
    .module('livingDocumentation.directives', [])
    .directive('appVersion', wrapInjectionConstructor(AppVersion));
