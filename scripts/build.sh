#!/bin/sh
mkdir build &> /dev/null
./node_modules/.bin/babel --presets react main.jsx > build/main.js

mkdir -p static/js &> /dev/null
./node_modules/.bin/browserify build/main.js -o static/js/bundle.js
