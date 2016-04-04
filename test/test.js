var System = require('systemjs');

System.config({
    map: {
        typescript: './node_modules/typescript/lib/typescript.js',
        should: './node_modules/should/should.js'
    },
    transpiler: 'typescript',
    typescriptOptions: {
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        sourceMap: true,
        inlineSourceMap: true
    },
    packages: {
        'app': { defaultExtension: 'ts' },
        'test': { defaultExtension: 'ts' }
    }
});

System.import('test/main').then(function() { run(); }, console.error.bind(console));
