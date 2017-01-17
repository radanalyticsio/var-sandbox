#!/bin/sh
mkdir -p dist/static/js &> /dev/null
./node_modules/.bin/babel --presets react src/main.jsx | ./node_modules/.bin/browserify - -o dist/static/js/bundle.js

cp src/app.py dist/
cp -r src/css dist/static/
cp -r src/templates dist/
