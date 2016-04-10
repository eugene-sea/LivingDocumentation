import { Injectable, Inject } from 'angular2/core';
import { Router } from 'angular2/router';
import { URLSearchParams } from 'angular2/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

import { ILivingDocumentation } from '../domain-model';
import { ILivingDocumentationServer } from './living-documentation-server';
import { ISearchService, ISearchContext } from './search-service';

export enum DocumentationFilter {
    InProgress,
    Pending,
    Failing,
    Manual
}

export interface ILivingDocumentationService {
    loading: boolean;

    error: string;

    ready: boolean;

    documentationListObservable: Observable<ILivingDocumentation[]>;

    filteredDocumentationListObservable: Observable<ILivingDocumentation[]>;

    searchContext: ISearchContext;

    searchText: string;

    filter: DocumentationFilter;

    onStartProcessing: () => void;

    onStopProcessing: () => void;

    startInitialization(): void;

    search(searchText: string): void;

    showOnly(filter: DocumentationFilter, initialize?: boolean): void;

    addQueryParameters(params: any): any;
}

const TIMEOUT = 200;

@Injectable()
export class LivingDocumentationService implements ILivingDocumentationService {
    loading: boolean;

    error: string;

    ready: boolean;

    documentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);

    filteredDocumentationListObservable = new BehaviorSubject(<ILivingDocumentation[]>[]);
    private get filteredDocumentationList(): ILivingDocumentation[] {
        return this.filteredDocumentationListObservable.value;
    }

    private set filteredDocumentationList(value: ILivingDocumentation[]) {
        this.filteredDocumentationListObservable.next(value);
    }

    searchContext: ISearchContext = null;

    onStartProcessing: () => void;

    onStopProcessing: () => void;

    private currentSearchText = '';

    constructor(
        @Inject('livingDocumentationServer') private livingDocumentationServer: ILivingDocumentationServer,
        @Inject('search') private searchService: ISearchService,
        private router: Router
    ) {
        this.loading = true;
    }

    get searchText(): string {
        return this.router.currentInstruction && this.router.currentInstruction.component.params['search'];
    }

    get filter(): DocumentationFilter { return this.filterRaw && (<any>DocumentationFilter)[this.filterRaw]; }

    private get filterRaw(): string {
        return this.router.currentInstruction && this.router.currentInstruction.component.params['showOnly'];
    }

    startInitialization(): void {
        if (this.onStartProcessing) {
            this.onStartProcessing();
        }

        this.livingDocumentationServer.getResourceDefinitions()
            .concatMap(resources => Observable.zip(..._.map(resources, r => this.livingDocumentationServer.get(r))))
            .delay(TIMEOUT)
            .subscribe(
            (docs: ILivingDocumentation[]) => {
                this.documentationListObservable.next(docs);
                this.initialize();
            },
            err => this.onError(err),
            () => this.onStopProcessing()
            );
    }

    search(searchText: string): void {
        if (!searchText) {
            [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [this.documentationListObservable.value, null, null];
            this.router.navigateByUrl(this.router.currentInstruction.urlPath);
            return;
        }

        this.updateQueryParameterAndNavigate('search', searchText);
    }

    showOnly(filter: DocumentationFilter, initialize?: boolean): void {
        if (initialize) {
            this.searchCore();
        } else {
            this.updateQueryParameterAndNavigate('showOnly', DocumentationFilter[filter]);
        }
    }

    addQueryParameters(params: any): any {
        params = params || {};
        if (this.searchText) {
            params.search = this.searchText;
        }

        if (this.filterRaw) {
            params.showOnly = this.filterRaw;
        }

        return params;
    }

    private onError(err: any) {
        console.error(err);
        this.error = err;
        this.loading = false;
    }

    private initialize() {
        this.loading = false;
        this.ready = true;
        this.filteredDocumentationList = this.documentationListObservable.value;
    }

    private updateQueryParameterAndNavigate(param: string, paramValue: string) {
        const query = this.router.currentInstruction.toUrlQuery();
        const params = new URLSearchParams(query && query.slice(1));
        params.set(param, paramValue);
        this.router.navigateByUrl(`/${this.router.currentInstruction.urlPath}?${params.toString()}`)
            .then(() => this.searchCore());
    }

    private searchCore() {
        let searchText: string;

        switch (this.filter) {
            case DocumentationFilter.InProgress:
                searchText = '@iteration ';
                break;
            case DocumentationFilter.Pending:
                searchText = '@pending ';
                break;
            case DocumentationFilter.Failing:
                searchText = '@failing ';
                break;
            case DocumentationFilter.Manual:
                searchText = '@manual ';
                break;
            default:
                searchText = '';
        }

        searchText += this.searchText || '';

        if (searchText !== this.currentSearchText) {
            const res = this.searchService.search(searchText, this.documentationListObservable.value);
            [this.filteredDocumentationList, this.searchContext, this.currentSearchText] =
                [res.documentationList, res.searchContext, searchText];
        }

        let [documentationCode, featureCode] = [
            this.router.currentInstruction.component.params['documentationCode'],
            this.router.currentInstruction.component.params['featureCode']
        ];

        if (documentationCode && featureCode) {
            let documentation = _.find(
                this.filteredDocumentationList, doc => doc.definition.code === documentationCode);
            if (!documentation) {
                documentationCode = null;
            } else {
                let feature = documentation.features[featureCode];
                if (!feature) {
                    featureCode = null;
                }
            }
        }

        if (!documentationCode || !featureCode) {
            let documentation = _.find(this.filteredDocumentationList, d => _.any(d.features));
            if (documentation) {
                [documentationCode, featureCode] =
                    [documentation.definition.code, _.find(documentation.features, _ => true).code];
            }
        }

        if (!documentationCode || !featureCode) {
            this.router.navigate(['/Dashboard', this.addQueryParameters({})]);
        } else {
            this.router.navigate(['/Feature', this.addQueryParameters({
                documentationCode: documentationCode,
                featureCode: featureCode
            })]);
        }
    }
}
