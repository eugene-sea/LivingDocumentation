/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../js/services.ts" />

'use strict';

module livingDocumentation {
    class RootCtrl {
        static $inject: string[] = ['livingDocumentationService', '$modal'];

        constructor(
            private livingDocService: ILivingDocumentationService, $modal: ng.ui.bootstrap.IModalService) {
            this.documentationList = livingDocService.documentationList;

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

        documentationList: ILivingDocumentation[];

        get lastUpdatedOn() {
            return _.find(this.livingDocService.documentationList, doc => <any>doc.lastUpdatedOn).lastUpdatedOn;
        }
    }

    angular.module('livingDocumentation.controllers.root', ['livingDocumentation.services'])
        .controller('RootCtrl', RootCtrl);
}
