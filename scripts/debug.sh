#!/bin/sh

export VAR_DEBUG=true

SPARK_SUBMIT_CMD=${SPARK_SUBMIT_CMD:-python}

pushd dist
export LC_ALL=en_US.utf8
export LANG=en_US.utf8
$SPARK_SUBMIT_CMD app.py
popd


