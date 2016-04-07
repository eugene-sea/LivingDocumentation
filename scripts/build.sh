#!/bin/bash

./node_modules/.bin/typings install
cd ./app/
../node_modules/.bin/typings install
cd ..

tsc -p .
tsc -p ./app
tsc -p ./test

mkdir -p ./app/node_components/systemjs
cp ./node_modules/systemjs/dist/system.src.js ./app/node_components/systemjs/
cp ./node_modules/systemjs/dist/system-polyfills.src.js ./app/node_components/systemjs/

mkdir -p ./app/node_components/typescript
cp ./node_modules/typescript/lib/typescript.js ./app/node_components/typescript/

mkdir -p ./app/node_components/es6-shim
cp ./node_modules/es6-shim/es6-shim.js ./app/node_components/es6-shim/

mkdir -p ./app/node_components/angular2
cp ./node_modules/angular2/es6/dev/src/testing/shims_for_IE.js ./app/node_components/angular2/
cp ./node_modules/angular2/bundles/angular2-polyfills.js ./app/node_components/angular2/
cp ./node_modules/angular2/bundles/angular2.dev.js ./app/node_components/angular2/
cp ./node_modules/angular2/bundles/upgrade.dev.js ./app/node_components/angular2/

mkdir -p ./app/node_components/rxjs
cp ./node_modules/rxjs/bundles/Rx.js ./app/node_components/rxjs/

mkdir -p ./app/node_components/ng2-bootstrap
cp ./node_modules/ng2-bootstrap/bundles/ng2-bootstrap.js ./app/node_components/ng2-bootstrap/

mkdir -p ./app/node_components/moment
cp ./node_modules/ng2-bootstrap/node_modules/moment/moment.js ./app/node_components/moment/
