import { ILivingDocumentationService, DocumentationFilter } from '../services';
import { wrapInjectionConstructor } from '../utils';

class LivingDocumentationAppDirective implements ng.IDirective {
    restrict = 'A';
    controller = 'LivingDocumentationApp';
    controllerAs = 'root';
    bindToController = true;
    templateUrl = 'components/living_documentation_app/living-documentation-app.tpl.html';
}

class LivingDocumentationApp {
    static $inject: string[] = ['livingDocumentationService', '$modal'];

    searchText: string;
    lastUpdatedOn: Date;

    documentationFilter = DocumentationFilter;

    constructor(private livingDocService: ILivingDocumentationService, $modal: ng.ui.bootstrap.IModalService) {
        let modalInstance: ng.ui.bootstrap.IModalServiceInstance;

        livingDocService.onStartProcessing = () => {
            if (modalInstance) {
                return;
            }

            modalInstance = $modal.open({ backdrop: 'static', keyboard: false, templateUrl: 'processing.html' });
        };

        let self = this;
        livingDocService.onStopProcessing = () => {
            if (self.isClearSearchEnabled) {
                if (!self.searchText) {
                    self.showOnly(null, true);
                } else {
                    self.search();
                }
            }

            modalInstance.close();
            modalInstance = null;
        };

        this.livingDocService.documentationListObservable
            .map(l => _.find(l, doc => !!doc.lastUpdatedOn))
            .filter(d => d != null)
            .subscribe(d => this.lastUpdatedOn = d.lastUpdatedOn);

        this.searchText = livingDocService.searchText || '';
        livingDocService.startInitialization();
    }

    get loading() { return this.livingDocService.loading; }
    set loading(value) { ; }

    get error() { return this.livingDocService.error; }
    get ready() { return this.livingDocService.ready; }

    get isSearchEnabled() { return !!this.searchText.trim(); }
    get isClearSearchEnabled() {
        return !!this.livingDocService.searchText || this.filter != null;
    }

    get filter() { return this.livingDocService.filter; }

    get searchPart() { return this.livingDocService.urlSearchPart; }

    search(): void {
        this.livingDocService.search(this.searchText);
    }

    clearSearch(): void {
        this.livingDocService.search(null);
    }

    clearFilter(): void {
        this.livingDocService.showOnly(null);
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        this.livingDocService.showOnly(filter, initialize);
    }
}

angular.module('livingDocumentation.app', [
    'ui.bootstrap',
    'livingDocumentation.services',
    'livingDocumentation.directives',
    'livingDocumentation.documentationList'
])
    .directive('livingDocumentationApp', wrapInjectionConstructor(LivingDocumentationAppDirective))
    .controller('LivingDocumentationApp', LivingDocumentationApp);
