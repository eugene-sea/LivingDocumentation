import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { SearchService } from './search.service';
import { BackendService } from './backend.service';
import { LivingDocumentationService } from './living-documentation.service';
import { AppComponent } from './app.component';
import { NewlinePipe } from './pipes/newline.pipe';
import { SplitWordsPipe } from './pipes/split-words.pipe';
import { ScenarioOutlinePlaceholderPipe } from './pipes/scenario-outline-placeholder.pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { HighlightTagPipe } from './pipes/highlight-tag.pipe';
import { WidenPipe } from './pipes/widen.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { TagListComponent } from './dashboard/tag-list/tag-list.component';
import { StatisticsComponent } from './dashboard/statistics/statistics.component';
import { DocumentationDashboardComponent } from './dashboard/documentation-dashboard/documentation-dashboard.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { FolderComponent } from './documentation-list/folder/folder.component';
import { DocumentationListComponent } from './documentation-list/documentation-list/documentation-list.component';
import { TagsComponent } from './feature/tags/tags.component';
import { StatusComponent } from './feature/status/status.component';
import { TableComponent } from './feature/table/table.component';
import { ScenarioComponent } from './feature/scenario/scenario.component';
import { FeatureComponent } from './feature/feature/feature.component';

@NgModule({
  declarations: [
    AppComponent,
    NewlinePipe,
    SplitWordsPipe,
    ScenarioOutlinePlaceholderPipe,
    HighlightPipe,
    HighlightTagPipe,
    WidenPipe,
    SafePipe,
    TagListComponent,
    StatisticsComponent,
    DocumentationDashboardComponent,
    DashboardComponent,
    FolderComponent,
    DocumentationListComponent,
    TagsComponent,
    StatusComponent,
    TableComponent,
    ScenarioComponent,
    FeatureComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpModule,
    NgbModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    { provide: 'version', useValue: '0.9' },
    { provide: 'search', useClass: SearchService },
    { provide: 'backend', useClass: BackendService },
    { provide: 'livingDocumentationService', useClass: LivingDocumentationService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
