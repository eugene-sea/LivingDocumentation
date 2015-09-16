/// <reference path="../../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../services.ts" />

'use strict';

module livingDocumentation {
    class LivingDocumentationAppDirective implements ng.IDirective {
        restrict = 'A';
        controller = 'LivingDocumentationApp';
        controllerAs = 'root';
        bindToController = true;
        templateUrl = 'components/living_documentation_app/living-documentation-app.tpl.html'
    }

    class LivingDocumentationApp {
        searchText: string;

        static $inject: string[] = ['livingDocumentationService', '$modal'];

        DocumentationFilter = DocumentationFilter;

        constructor(private livingDocService: ILivingDocumentationService, $modal: ng.ui.bootstrap.IModalService) {
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance;

            livingDocService.onStartProcessing = () => {
                if (modalInstance) {
                    return;
                }

                modalInstance = $modal.open({ templateUrl: 'processing.html', backdrop: 'static', keyboard: false });
            };

            var this_ = this;
            livingDocService.onStopProcessing = () => {
                if (this_.isClearSearchEnabled) {
                    if (!this_.searchText) {
                        this_.showOnly(null, true);
                    } else {
                        this_.search();
                    }
                }

                modalInstance.close();
                modalInstance = null;
            };

            this.searchText = livingDocService.searchText || '';
            livingDocService.startInitialization();
        }

        get loading() { return this.livingDocService.loading; }
        set loading(value) { }

        get error() { return this.livingDocService.error; }
        get ready() { return this.livingDocService.ready; }

        get isSearchEnabled() { return !!this.searchText.trim(); }
        get isClearSearchEnabled() {
            return !!this.livingDocService.searchText || this.filter != null;
        }

        get filter() { return this.livingDocService.filter; }

        get lastUpdatedOn() {
            return _.find(this.livingDocService.documentationList, doc => !!doc.lastUpdatedOn).lastUpdatedOn;
        }

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
        'livingDocumentation.documentationList',
    ])
        .directive('livingDocumentationApp', utils.wrapInjectionConstructor(LivingDocumentationAppDirective))
        .controller('LivingDocumentationApp', LivingDocumentationApp);
}
