#!/bin/sh
pushd dist
export LC_ALL=en_US.utf8
export LANG=en_US.utf8
python app.py
popd

