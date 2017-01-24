#!/bin/sh
# create the output directory
mkdir -p dist/static/js &> /dev/null

# build the react components and compile the javascript bundle, including
# patternfly, bootstrap and jquery
./node_modules/.bin/babel --presets react src/main.jsx | \
    ./node_modules/.bin/browserify - -o dist/static/js/bundle.js

# copy the application related source, static files and templates
cp src/app.py dist/
cp -r src/css dist/static/
cp -r src/templates dist/

# add the patternfly css, fonts and related javascript
cp node_modules/patternfly/dist/css/*min* dist/static/css/
cp -r node_modules/patternfly/dist/fonts dist/static/
cp node_modules/jquery/dist/jquery.min.js dist/static/js/
cp node_modules/bootstrap/dist/js/bootstrap.min.js dist/static/js/
cp node_modules/patternfly/dist/js/patternfly.min.js dist/static/js/
