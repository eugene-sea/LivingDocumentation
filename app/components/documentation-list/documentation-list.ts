import { CommonModule } from '@angular/common';
import { NgModule, Component, Input, Inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { IFolder, IFeature } from '../../domain-model';
import { ILivingDocumentationService } from '../living-documentation-service';

import { PipesModule } from '../pipes';

@Component({
    selector: 'folder',
    templateUrl: 'components/documentation-list/folder.html'
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
}

@Component({
    selector: 'documentation-list',
    templateUrl: 'components/documentation-list/documentation-list.html'
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

@NgModule({
    declarations: [Folder, DocumentationList],
    exports: [DocumentationList],
    imports: [CommonModule, RouterModule, NgbModule, PipesModule]
})
export class DocumentationListModule { }
