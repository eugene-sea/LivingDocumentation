import { provide } from 'angular2/core';
import { bootstrap } from 'angular2/platform/browser';
import { LocationStrategy, HashLocationStrategy, ROUTER_PROVIDERS } from 'angular2/router';
import { HTTP_PROVIDERS } from 'angular2/http';

import 'rxjs/Rx';

import { LivingDocumentationApp } from './components/living-documentation-app/living-documentation-app';
import SearchService from './components/search-service';
import LivingDocumentationServer from './components/living-documentation-server';
import LivingDocumentationService from './components/living-documentation-service';

bootstrap(LivingDocumentationApp, [
    HTTP_PROVIDERS,
    ROUTER_PROVIDERS,
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide('version', { useValue: '0.9' }),
    provide('search', { useClass: SearchService }),
    provide('livingDocumentationServer', { useClass: LivingDocumentationServer }),
    provide('livingDocumentationService', { useClass: LivingDocumentationService })
]);
