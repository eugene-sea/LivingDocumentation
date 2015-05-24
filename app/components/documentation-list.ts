/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../js/utils.ts" />
/// <reference path="../js/services.ts" />

'use strict';

module livingDocumentation {
    class DocumentationListDirective implements ng.IDirective {
        static $inject: string[] = [];
        restrict = 'A';
        controller = 'DocumentationList';
        controllerAs = 'root';
        bindToController = true;
        templateUrl = 'components/documentation-list.tpl.html'
    }

    class DocumentationList {
        static $inject = ['livingDocumentationService'];
        
        constructor(livingDocService: ILivingDocumentationService) {
            this.documentationList = livingDocService.documentationList;
        }
        
        documentationList: ILivingDocumentation[];
    }

    angular
        .module('livingDocumentation.documentationList', ['livingDocumentation.services'])
        .directive('documentationList', utils.wrapInjectionConstructor(DocumentationListDirective))
        .controller('DocumentationList', DocumentationList);
}
