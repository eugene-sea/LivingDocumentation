import { Component, Input, Inject, OnInit, forwardRef } from 'angular2/core';

import { adapter } from '../adapter';

import { IFolder, IFeature } from '../../domain-model';
import { ILivingDocumentationService } from '../services';
import { wrapInjectionConstructor } from '../utils';
import { HighlightPipe, SplitWordsFilter } from '../filters';

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

@Component({
    directives: [forwardRef(() => Folder)],
    pipes: [HighlightPipe, SplitWordsFilter],
    selector: 'folder',
    templateUrl: 'components/documentation_list/folder.tpl.html'
})
class Folder implements OnInit {
    @Input() documentationCode: string;
    @Input() folder: IFolder;
    childrenFolders: IFolder[];
    childrenFeatures: IFeature[];

    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
    ) { }

    ngOnInit(): void {
        this.childrenFolders = this.folder.children.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        this.childrenFeatures = this.folder.features.sort(
            (a, b) => a.Feature.Name < b.Feature.Name ? -1 : a.Feature.Name > b.Feature.Name ? 1 : 0);
    }

    getFeatureUrl(feature: IFeature): string {
        return `#/feature/${this.documentationCode}/${feature.code}${this.livingDocService.urlSearchPart}`;
    }

    isFeatureActive(feature: IFeature): boolean {
        return this.livingDocService.isUrlActive(this.getFeatureUrl(feature).substr(1));
    }
}

angular.module('livingDocumentation.documentationList', ['livingDocumentation.services'])
    .directive('documentationList', wrapInjectionConstructor(DocumentationListDirective))
    .controller('DocumentationList', DocumentationList)
    .directive('folder', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Folder));
