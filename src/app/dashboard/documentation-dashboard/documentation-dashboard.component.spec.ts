import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationDashboardComponent } from './documentation-dashboard.component';

describe('DocumentationDashboardComponent', () => {
  let component: DocumentationDashboardComponent;
  let fixture: ComponentFixture<DocumentationDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentationDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
