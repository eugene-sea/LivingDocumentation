import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Route, RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { HttpModule } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/Rx';

import { DropdownModule } from 'ng2-bootstrap/ng2-bootstrap';

import SearchService from './components/search-service';
import LivingDocumentationServer from './components/living-documentation-server';
import LivingDocumentationService from './components/living-documentation-service';
import { LivingDocumentationApp } from './components/living-documentation-app/living-documentation-app';

import { DocumentationListModule } from './components/documentation-list/documentation-list';
import { TagList } from './components/tag-list/tag-list';
import { Statistics, DocumentationDashboard, Dashboard } from './components/dashboard/dashboard';
import { FeatureModule } from './components/feature/feature';

@Component({
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

const routes: Route[] = [
    { component: Dashboard, path: 'dashboard' },
    { component: FeatureContainer, path: 'feature/:documentationCode/:featureCode' },
    { component: Dashboard, path: '**' }
];

@NgModule({
    bootstrap: [LivingDocumentationApp],
    declarations: [
        LivingDocumentationApp,
        TagList,
        Statistics,
        DocumentationDashboard,
        Dashboard,
        FeatureContainer
    ],
    imports: [
        CommonModule,
        BrowserModule,
        RouterModule.forRoot(routes),
        HttpModule,
        DropdownModule,
        FormsModule,
        ReactiveFormsModule,
        FeatureModule,
        DocumentationListModule
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: 'version', useValue: '0.9' },
        { provide: 'search', useClass: SearchService },
        { provide: 'livingDocumentationServer', useClass: LivingDocumentationServer },
        { provide: 'livingDocumentationService', useClass: LivingDocumentationService }
    ]
})
export class AppModule { }
