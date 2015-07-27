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
        static $inject: string[] = ['livingDocumentationService', '$modal'];

        constructor(
            private livingDocService: ILivingDocumentationService, $modal: ng.ui.bootstrap.IModalService) {
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance;

            livingDocService.onStartProcessing = () => {
                if (modalInstance) {
                    return;
                }

                modalInstance = $modal.open({ templateUrl: 'processing.html', backdrop: 'static', keyboard: false });
            };

            livingDocService.onStopProcessing = () => {
                modalInstance.close();
                modalInstance = null;
            };

            livingDocService.startInitialization();
        }

        get loading() { return this.livingDocService.loading; }
        set loading(value) { }

        get error() { return this.livingDocService.error; }
        get ready() { return this.livingDocService.ready; }

        get lastUpdatedOn() {
            return _.find(this.livingDocService.documentationList, doc => <any>doc.lastUpdatedOn).lastUpdatedOn;
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
