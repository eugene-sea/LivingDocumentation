import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule, ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';

import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { FeatureComponent } from './feature/feature/feature.component';

const routes: Routes = [
  { component: DashboardComponent, path: 'dashboard' },
  { component: FeatureComponent, path: 'feature/:documentationCode/:featureCode' },
  { component: DashboardComponent, path: '**' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
