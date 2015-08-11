'use strict';

module livingDocumentation {
    export interface ITable {
        HeaderRow: string[];
        DataRows: string[][];
    }

    export interface IStep {
        Keyword: string;
        Name: string;
        TableArgument?: ITable;
        DocStringArgument?: string;
    }

    export interface IResult {
        WasExecuted: boolean;
        WasSuccessful: boolean;
    }

    export interface IScenario {
        Name: string;
        Description: string;
        Tags: string[];
        Steps: IStep[];
        Examples?: {
            Decription: string;
            TableArgument: ITable;
        };
        Result: IResult;

        tests: string[];
        isExpanded: boolean;
    }

    export interface IFeature {
        code: string;
        isExpanded: boolean;

        RelativeFolder: string;
        Feature: {
            Name: string;
            Description: string;
            Tags: string[];
            Background?: IScenario;
            FeatureElements: IScenario[];
            Result: IResult;
        };
    }

    export interface IFeatures {
        [code: string]: IFeature;
    }

    export interface IFolder {
        name: string;
        children: IFolder[];
        features: IFeature[];
        isRoot?: boolean;
    }

    export interface ILivingDocumentationResourceDefinition {
        code: string;
        name: string;
        description: string;
        sortOrder: number;
        featuresResource: string;
        issueTrackingRegExp: string;
        issueTrackingUri: string;
        featureEditUri?: string;
        testsResources?: string;
        testUri?: string;
    }

    export interface ILivingDocumentation {
        definition: ILivingDocumentationResourceDefinition;
        root: IFolder;
        features: IFeatures;
        lastUpdatedOn: Date;
    }
}
