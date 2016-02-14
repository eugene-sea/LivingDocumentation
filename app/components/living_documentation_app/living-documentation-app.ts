/// <reference path="../../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../services.ts" />

namespace livingDocumentation {
    'use strict';

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

        constructor(private livingDocService: ILivingDocumentationService, $modal: ng.ui.bootstrap.IModalService) {
            let modalInstance: ng.ui.bootstrap.IModalServiceInstance;

            livingDocService.onStartProcessing = () => {
                if (modalInstance) {
                    return;
                }

                modalInstance = $modal.open({ backdrop: 'static', keyboard: false, templateUrl: 'processing.html' });
            };

            let _this = this;
            livingDocService.onStopProcessing = () => {
                if (_this.isClearSearchEnabled) {
                    if (!_this.searchText) {
                        _this.showOnly(null, true);
                    } else {
                        _this.search();
                    }
                }

                modalInstance.close();
                modalInstance = null;
            };

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
        'livingDocumentation.documentationList'
    ])
        .directive('livingDocumentationApp', utils.wrapInjectionConstructor(LivingDocumentationAppDirective))
        .controller('LivingDocumentationApp', LivingDocumentationApp);
}
