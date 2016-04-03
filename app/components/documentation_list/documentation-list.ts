import { ILivingDocumentationService } from '../services';
import { RecursionHelper } from '../recursion-helper';
import '../recursion-helper';
import { wrapInjectionConstructor } from '../utils';

class DocumentationListDirective implements ng.IDirective {
    restrict = 'A';
    controller = 'DocumentationList';
    controllerAs = 'root';
    bindToController = true;
    templateUrl = 'components/documentation_list/documentation-list.tpl.html';
}

class DocumentationList {
    static $inject = ['livingDocumentationService'];

    constructor(private livingDocService: ILivingDocumentationService) { }

    get documentationList() { return this.livingDocService.filteredDocumentationList; }
}

class FolderDirective implements ng.IDirective {
    static $inject = ['recursionHelper'];

    constructor(private recursionHelper: RecursionHelper, private $location: ng.ILocationService) { }

    restrict = 'A';
    scope = {
        documentationCode: '=',
        folder: '='
    };
    controller = Folder;
    controllerAs = 'ctrl';
    bindToController = true;
    templateUrl = 'components/documentation_list/folder.tpl.html';
    compile = (element: ng.IAugmentedJQuery) => this.recursionHelper.compile(element);
}

class Folder {
    static $inject = ['livingDocumentationService'];

    constructor(private livingDocService: ILivingDocumentationService) { }

    get searchPart() { return this.livingDocService.urlSearchPart; }
}

angular.module('livingDocumentation.documentationList', [
    'livingDocumentation.services',
    'livingDocumentation.services.recursionHelper',
    'livingDocumentation.filters'
])
    .directive('documentationList', wrapInjectionConstructor(DocumentationListDirective))
    .controller('DocumentationList', DocumentationList)
    .directive('folder', wrapInjectionConstructor(FolderDirective));
