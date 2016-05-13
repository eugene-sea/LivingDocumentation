import { provide } from '@angular/core';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { HTTP_PROVIDERS } from '@angular/http';

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
