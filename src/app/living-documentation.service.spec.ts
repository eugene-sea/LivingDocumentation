import { TestBed, inject } from '@angular/core/testing';

import { LivingDocumentationService } from './living-documentation.service';

describe('LivingDocumentationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LivingDocumentationService]
    });
  });

  it('should ...', inject([LivingDocumentationService], (service: LivingDocumentationService) => {
    expect(service).toBeTruthy();
  }));
});
