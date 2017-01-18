#!/bin/sh

if [ -z "$SPARK_SUBMIT_CMD" ]
then
    echo "Error: please tell me where the spark-submit command is by setting SPARK_SUBMIT_CMD"
    exit 1
fi

pushd dist
export LC_ALL=en_US.utf8
export LANG=en_US.utf8
$SPARK_SUBMIT_CMD app.py
popd

