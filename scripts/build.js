require('shelljs/global');

function buryCopy(src, destinationFolder) {
    mkdir('-p', destinationFolder);
    cp(src, destinationFolder);
}

exec('tsc -p .');
exec('tsc -p ./app');
exec('tsc -p ./test');

const Builder = require("systemjs-builder");

var options = {
    normalize: true,
    runtime: false,
    sourceMaps: true,
    sourceMapContents: true,
    minify: false,
    mangle: false
};
var builder = new Builder('./');
builder.config({
    paths: {
        "n:*": "node_modules/*",
        "rxjs/*": "node_modules/rxjs/*.js",
    },
    map: {
        "rxjs": "n:rxjs",
    },
    packages: {
        "rxjs": { main: "Rx.js", defaultExtension: "js" },
    }
});

builder.bundle('rxjs', './app/node_components/rxjs/Rx.js', options);

buryCopy('./node_modules/systemjs/dist/system.src.js', './app/node_components/systemjs/');

buryCopy('./node_modules/typescript/lib/typescript.js', './app/node_components/typescript/');

buryCopy('./node_modules/es6-shim/es6-shim.js', './app/node_components/es6-shim/');

buryCopy('./node_modules/zone.js/dist/zone.js', './app/node_components/zone.js/');

buryCopy('./node_modules/reflect-metadata/Reflect.js', './app/node_components/reflect-metadata/');
buryCopy('./node_modules/reflect-metadata/Reflect.js.map', './app/node_components/reflect-metadata/');

buryCopy('./node_modules/@angular/common/bundles/common.umd.js', './app/node_components/@angular/common/');
buryCopy('./node_modules/@angular/compiler/bundles/compiler.umd.js', './app/node_components/@angular/compiler/');
buryCopy('./node_modules/@angular/core/bundles/core.umd.js', './app/node_components/@angular/core/');
buryCopy('./node_modules/@angular/http/bundles/http.umd.js', './app/node_components/@angular/http/');
buryCopy(
    './node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
    './app/node_components/@angular/platform-browser/'
);
buryCopy(
    './node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
    './app/node_components/@angular/platform-browser-dynamic/'
);
buryCopy('./node_modules/@angular/router/bundles/router.umd.js', './app/node_components/@angular/router/');
buryCopy('./node_modules/@angular/forms/bundles/forms.umd.js', './app/node_components/@angular/forms/');
buryCopy('./node_modules/@angular/core/src/facade/lang.js', './app/node_components/@angular/core/src/facade/lang/');
buryCopy('./node_modules/@angular/core/src/facade/lang.js.map', './app/node_components/@angular/core/src/facade/lang/');

buryCopy('./node_modules/bootstrap/dist/css/bootstrap.css', './app/node_components/bootstrap/css/');
buryCopy('./node_modules/bootstrap/dist/css/bootstrap.css.map', './app/node_components/bootstrap/css/');
buryCopy('./node_modules/bootstrap/dist/fonts/*', './app/node_components/bootstrap/fonts/');

buryCopy('./node_modules/ng2-bootstrap/bundles/ng2-bootstrap.js', './app/node_components/ng2-bootstrap/');

buryCopy('./node_modules/moment/moment.js', './app/node_components/moment/');

buryCopy('./node_modules/underscore/underscore.js', './app/node_components/underscore/');
