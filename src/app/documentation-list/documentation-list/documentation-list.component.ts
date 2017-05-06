import { Component, Inject } from '@angular/core';

import { ILivingDocumentationService } from '../../living-documentation.service';

@Component({
  selector: 'ld-documentation-list',
  templateUrl: './documentation-list.component.html',
  styleUrls: ['./documentation-list.component.css']
})
export class DocumentationListComponent {
  constructor(
    @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService
  ) { }

  get documentationList() {
    return this.livingDocService.filteredDocumentationListObservable.map(
      l => l.sort((a, b) => a.definition.sortOrder - b.definition.sortOrder)
    );
  }
}
