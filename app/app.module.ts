import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ActivatedRoute, RouterConfig, RouterModule } from '@angular/router';
import { provide, Component } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { HTTP_PROVIDERS } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/Rx';

import SearchService from './components/search-service';
import LivingDocumentationServer from './components/living-documentation-server';
import LivingDocumentationService from './components/living-documentation-service';
import { LivingDocumentationApp } from './components/living-documentation-app/living-documentation-app';

import { Dashboard } from './components/dashboard/dashboard';
import { Feature } from './components/feature/feature';
import {
    HighlightPipe, HighlightTagPipe, NewLinePipe, ScenarioOutlinePlaceholderPipe, WidenPipe, SplitWordsPipe, SafePipe
} from './components/pipes';

@Component({
    directives: [Feature],
    selector: 'feature-container',
    template: '<feature [documentationCode]="documentationCode" [featureCode]="featureCode"></feature>'
})
class FeatureContainer {
    documentationCode: Observable<string>;
    featureCode: Observable<string>;
    constructor(activatedRoute: ActivatedRoute) {
        this.documentationCode = activatedRoute.params.map(r => r['documentationCode']);
        this.featureCode = activatedRoute.params.map(r => r['featureCode']);
    }
}

const routes: RouterConfig = [
    { component: Dashboard, path: 'dashboard' },
    { component: FeatureContainer, path: 'feature/:documentationCode/:featureCode' },
    { component: Dashboard, path: '**' }
];

@NgModule({
    bootstrap: [LivingDocumentationApp],
    declarations: [
        LivingDocumentationApp,
        Dashboard,
        FeatureContainer,
        HighlightPipe,
        HighlightTagPipe,
        NewLinePipe,
        ScenarioOutlinePlaceholderPipe,
        WidenPipe,
        SplitWordsPipe,
        SafePipe
    ],
    imports: [BrowserModule, RouterModule.forRoot(routes)],
    providers: [
        HTTP_PROVIDERS,
        provide(LocationStrategy, { useClass: HashLocationStrategy }),
        provide('version', { useValue: '0.9' }),
        provide('search', { useClass: SearchService }),
        provide('livingDocumentationServer', { useClass: LivingDocumentationServer }),
        provide('livingDocumentationService', { useClass: LivingDocumentationService })
    ]
})
export class AppModule { }
