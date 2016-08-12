import { provide } from '@angular/core';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { provideRouter } from '@angular/router';
import { HTTP_PROVIDERS } from '@angular/http';

import 'rxjs/Rx';

import { LivingDocumentationApp, routes } from './components/living-documentation-app/living-documentation-app';
import SearchService from './components/search-service';
import LivingDocumentationServer from './components/living-documentation-server';
import LivingDocumentationService from './components/living-documentation-service';

bootstrap(LivingDocumentationApp, [
    HTTP_PROVIDERS,
    provideRouter(routes/*, { enableTracing: true }*/),
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide('version', { useValue: '0.9' }),
    provide('search', { useClass: SearchService }),
    provide('livingDocumentationServer', { useClass: LivingDocumentationServer }),
    provide('livingDocumentationService', { useClass: LivingDocumentationService })
]);
