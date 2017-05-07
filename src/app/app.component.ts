import { Component, Inject, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { Observable } from 'rxjs/Rx';
import _ from 'underscore';

import { ILivingDocumentationService, DocumentationFilter } from './living-documentation.service';

@Component({
  selector: 'ld-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('loadingDataContent') loadingModalTemplate: TemplateRef<any>;

  form: FormGroup;
  searchControl = new FormControl();
  lastUpdatedOn: Observable<Date>;

  documentationFilter = DocumentationFilter;

  private loadingModal: NgbModalRef;

  constructor(
    @Inject('livingDocumentationService') private livingDocService: ILivingDocumentationService,
    @Inject('version') public appVersion: string,
    fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.form = fb.group({ 'searchControl': this.searchControl });

    this.searchControl.valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
      .subscribe((s: string) => s !== livingDocService.searchText && this.searchCore(s));

    this.lastUpdatedOn = livingDocService.documentationListObservable
      .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
      .filter(d => d != null)
      .map(d => d.lastUpdatedOn);

    livingDocService.searchTextObservable.subscribe(
      s => this.searchControl.setValue(s || '', { emitEvent: false })
    );
  }

  ngAfterViewInit() {
    this.livingDocService.loading.delay(1).subscribe(isLoading => {
      if (isLoading) {
        this.loadingModal = this.modalService.open(this.loadingModalTemplate, { backdrop: 'static', keyboard: false });
      } else {
        setTimeout(() => this.loadingModal.close(), 100);
      }
    });

    this.livingDocService.startInitialization();
  }

  get error() { return this.livingDocService.error; }

  get isClearSearchEnabled() {
    return !!this.livingDocService.searchText || this.filter != null;
  }

  get filter() { return this.livingDocService.filter; }

  search() {
    this.searchCore(this.searchControl.value);
  }

  clearSearch(): void {
    this.livingDocService.clearSearch();
  }

  clearFilter(): void {
    this.livingDocService.showOnly(null);
  }

  showOnly(filter: DocumentationFilter): void {
    this.livingDocService.showOnly(filter);
  }

  private searchCore(text: string): void {
    this.livingDocService.search(text);
  }
}
