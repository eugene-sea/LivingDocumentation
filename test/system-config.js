System.config({
    baseURL: '../',
    paths: {
        'moment': 'app/node_components/moment/moment.js'
    },
    map: {
        typescript: 'app/node_components/typescript/typescript.js',
    },
    transpiler: 'typescript',
    typescriptOptions: {
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
    },
    packages: {
        'app': { defaultExtension: 'ts' },
        'app/node_components': { },
        'test': { defaultExtension: 'ts' },
        'moment': { }
    }
});