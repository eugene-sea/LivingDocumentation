import { Component, Inject } from '@angular/core';

import { Observable } from 'rxjs/Rx';

import { ILivingDocumentationService } from '../../living-documentation.service';
import { ILivingDocumentation } from '../../domain-model';

@Component({
  selector: 'ld-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  documentationList: Observable<ILivingDocumentation[]>;

  constructor(
    @Inject('livingDocumentationService') livingDocumentationService: ILivingDocumentationService
  ) {
    this.documentationList = livingDocumentationService.documentationListObservable;
  }
}
