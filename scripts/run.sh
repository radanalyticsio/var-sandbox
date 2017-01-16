#!/bin/sh
pushd dist
export LC_ALL=en_US.utf8
export LANG=en_US.utf8
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=8080
popd
