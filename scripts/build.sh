#!/bin/bash

tsc -p .
tsc -p ./app
tsc -p ./test

mkdir -p ./app/node_modules/systemjs
cp ./node_modules/systemjs/dist/system.js ./app/node_modules/systemjs/system.js

mkdir -p ./app/node_modules/typescript
cp ./node_modules/typescript/lib/typescript.js ./app/node_modules/typescript/typescript.js
