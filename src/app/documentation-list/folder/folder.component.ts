import { Component, OnInit, Input, Inject } from '@angular/core';

import { ILivingDocumentationService } from '../../living-documentation.service';
import { IFolder, IFeature } from '../../domain-model';

@Component({
  selector: 'ld-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.css']
})
export class FolderComponent implements OnInit {
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
