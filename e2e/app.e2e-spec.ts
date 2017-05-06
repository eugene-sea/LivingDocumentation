import { LivingDocumentationPage } from './app.po';

describe('living-documentation App', () => {
  let page: LivingDocumentationPage;

  beforeEach(() => {
    page = new LivingDocumentationPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
