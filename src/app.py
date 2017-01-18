import multiprocessing
import os
import time
import uuid

import flask
from flask import json
from flask import views
import pyspark


class HTMLContent(views.MethodView):
    def get(self):
        return flask.render_template('index.html')


class PredictionAPI(views.MethodView):
    def __init__(self, input_queue):
        super(PredictionAPI, self).__init__()
        self.input_queue = input_queue

    def post(self):
        data = flask.request.json
        data.update({
            'status': 'training',
            'id': uuid.uuid4().hex})
        self.input_queue.put(data)
        return json.jsonify(data)


def processing_loop(spark_master, input_queue, start_queue):
    sconf = pyspark.SparkConf()
    sconf.setAppName('var-sandbox').setMaster(spark_master)
    sc = pyspark.SparkContext(conf=sconf)

    start_queue.put('ready')

    while True:
        req = input_queue.get()
        print(req)


def main():
    spark_master = os.environ.get('SPARK_MASTER', 'local[*]')
    input_queue = multiprocessing.Queue()
    start_queue = multiprocessing.Queue()

    process = multiprocessing.Process(
        target=processing_loop, args=(spark_master, input_queue, start_queue))
    process.start()

    start_queue.get()

    app = flask.Flask(__name__)
    app.add_url_rule('/', view_func=HTMLContent.as_view('html'))
    app.add_url_rule('/predictions',
                     view_func=PredictionAPI.as_view('predictions',
                                                     input_queue))
    app.run(host='0.0.0.0', port=8080)


if __name__ == '__main__':
    main()
