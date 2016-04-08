import { Component, Input, Inject, OnInit, forwardRef } from 'angular2/core';
import { ACCORDION_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { adapter } from '../adapter';

import { IFolder, IFeature } from '../../domain-model';
import { ILivingDocumentationService } from '../services';
import { HighlightPipe, SplitWordsFilter } from '../filters';

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
        return `#${this.getFeaturePath(feature)}${this.livingDocService.urlSearchPart}`;
    }

    isFeatureActive(feature: IFeature): boolean {
        return this.livingDocService.isUrlActive(this.getFeaturePath(feature));
    }

    private getFeaturePath(feature: IFeature): string {
        return `/feature/${this.documentationCode}/${feature.code}`;
    }
}

@Component({
    directives: [ACCORDION_DIRECTIVES, Folder],
    selector: 'documentation-list',
    templateUrl: 'components/documentation_list/documentation-list.tpl.html'
})
class DocumentationList {
    constructor(
        @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
    ) { }

    get documentationList() {
        return this.livingDocService.filteredDocumentationListObservable.map(
            l => l.sort((a, b) => a.definition.sortOrder - b.definition.sortOrder)
        );
    }
}

angular.module('livingDocumentation.documentationList', ['livingDocumentation.services'])
    .directive('documentationList', <ng.IDirectiveFactory>adapter.downgradeNg2Component(DocumentationList))
    .directive('folder', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Folder));
