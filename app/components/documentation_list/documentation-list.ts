/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../services.ts" />
/// <reference path="../recursion-helper.ts" />

'use strict';

module livingDocumentation {
    class DocumentationListDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        controller = 'DocumentationList';
        controllerAs = 'root';
        bindToController = true;
        templateUrl = 'components/documentation_list/documentation-list.tpl.html'
    }

    class DocumentationList {
        static $inject = ['livingDocumentationService'];

        constructor(livingDocService: ILivingDocumentationService) {
            this.documentationList = livingDocService.documentationList;
        }

        documentationList: ILivingDocumentation[];
    }

    class FolderDirective implements ng.IDirective {
        static $inject = ['recursionHelper'];

        constructor(private recursionHelper: utils.RecursionHelper) { }

        restrict = 'A';
        scope = {
            folder: '=',
            documentationCode: '='
        };
        controller = Folder;
        controllerAs = 'ctrl';
        bindToController = true;
        templateUrl = 'components/documentation_list/folder.tpl.html';
        compile = (element: ng.IAugmentedJQuery) => this.recursionHelper.compile(element);
    }

    class Folder { }

    angular.module('livingDocumentation.documentationList', [
        'livingDocumentation.services',
        'livingDocumentation.services.recursionHelper',
        'livingDocumentation.filters'
    ])
        .directive('documentationList', utils.wrapInjectionConstructor(DocumentationListDirective))
        .controller('DocumentationList', DocumentationList)
        .directive('folder', utils.wrapInjectionConstructor(FolderDirective));
}
