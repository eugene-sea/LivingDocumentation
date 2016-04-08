import { HTTP_PROVIDERS } from 'angular2/http';

import 'rxjs/Rx';

import { ILivingDocumentationService } from './components/services';
import { adapter } from './components/adapter';

import './components/living_documentation_app/living-documentation-app';
import './components/dashboard/dashboard';
import './components/documentation_list/documentation-list';
import './components/feature/feature';
import './components/directives';
import './components/filters';

adapter.addProvider(HTTP_PROVIDERS);

angular.module('livingDocumentation', [
    'ngRoute',
    'livingDocumentation.app',
    'livingDocumentation.controllers.dashboard',
    'livingDocumentation.feature'
]).config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    const resolve: { [key: string]: any; } = {
        livingDocumentationServiceReady: [
            'livingDocumentationService',
            (service: ILivingDocumentationService) => service.resolve
        ]
    };

    $routeProvider.when('/dashboard', {
        resolve: resolve,
        template: '<dashboard></dashboard>'
    });

    $routeProvider.when('/feature/:documentationCode/:featureCode', {
        resolve: resolve,
        template: ($routeParams: angular.route.IRouteParamsService) =>
            `<feature
                [feature-code]="'${$routeParams['featureCode']}'"
                [documentation-code]="'${$routeParams['documentationCode']}'">
             </feature>`
    });

    $routeProvider.otherwise({ redirectTo: '/dashboard' });
}]);

adapter.bootstrap(document.body, ['livingDocumentation']);
