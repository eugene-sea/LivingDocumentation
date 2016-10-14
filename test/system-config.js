var pkgPath = 'app/node_components/';
System.config({
    baseURL: '../',
    paths: {
        '@angular': pkgPath + '@angular',
        'moment': pkgPath + 'moment/moment.js',
        'underscore': pkgPath + 'underscore/underscore.js'
    },
    map: {
        typescript: pkgPath + 'typescript/typescript.js',
    },
    transpiler: 'typescript',
    typescriptOptions: {
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
    },
    packages: {
        '@angular/common': { main: 'common.umd.js' },
        '@angular/compiler': { main: 'compiler.umd.js' },
        '@angular/core': { main: 'core.umd.js' },
        '@angular/http': { main: 'http.umd.js' },
        '@angular/platform-browser': { main: 'platform-browser.umd.js' },
        '@angular/platform-browser-dynamic': { main: 'platform-browser-dynamic.umd.js' },
        '@angular/router': { main: 'router.umd.js' },
        '@angular/core/src/facade/lang': { main: 'lang.js' },
        'app': { defaultExtension: 'ts' },
        'app/node_components': {},
        'test': { defaultExtension: 'ts' },
        'moment': {}
    }
});
