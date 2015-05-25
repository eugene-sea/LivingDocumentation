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
    }

    export interface IScenario {
        Name: string;
        Description: string;
        Steps: IStep[];
        Examples?: {
            Decription: string;
            TableArgument: ITable;
        };

        tests: string[];
    }

    export interface IFeature {
        code: string;

        RelativeFolder: string;
        Feature: {
            Name: string;
            Description: string;
            Tags: string[];
            Background?: IScenario;
            FeatureElements: IScenario[];
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
