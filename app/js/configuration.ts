'use strict';

module livingDocumentation {
    export interface ILivingDocumentationResourceDefinition {
        code: string;
        name: string;
        description: string;
        sortOrder: number;
        featuresResource: string;
        testsResources?: string;
    }

    export var testUri = 'http://example.com/Tests/?Test=';

    export var livingDocumentationResources: ILivingDocumentationResourceDefinition[] = [
        {
            code: 'test',
            name: 'Test Knowledge Base',
            description: '',
            sortOrder: 1,
            featuresResource: 'test-data.json',
            testsResources: 'test-data-tests.json'
        }
    ];
}
