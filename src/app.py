import multiprocessing as mp
import os
import time
import threading
import uuid

import flask
from flask import json
from flask import views
import flask_socketio as io
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


def processing_loop(spark_master, input_queue, output_queue):
    sconf = pyspark.SparkConf()
    sconf.setAppName('var-sandbox').setMaster(spark_master)
    sc = pyspark.SparkContext(conf=sconf)

    output_queue.put('ready')

    while True:
        req = input_queue.get()
        time.sleep(2)
        req.update({'status': 'ready'})
        output_queue.put(req)


def responder_loop(socketio, output_queue):
    while True:
        res = output_queue.get()
        socketio.emit('update', json.dumps(res))


def main():
    spark_master = os.environ.get('SPARK_MASTER', 'local[*]')
    input_queue = mp.Queue()
    output_queue = mp.Queue()

    process = mp.Process(target=processing_loop,
                         args=(spark_master, input_queue, output_queue))
    process.start()

    output_queue.get()

    app = flask.Flask(__name__)
    app.config['SECRET_KEY'] = 'secret!'
    app.add_url_rule('/', view_func=HTMLContent.as_view('html'))
    app.add_url_rule('/predictions',
                     view_func=PredictionAPI.as_view('predictions',
                                                     input_queue))

    socketio = io.SocketIO(app)
    thread = threading.Thread(target=responder_loop, args=(socketio, output_queue))
    thread.start()
    socketio.run(app, host='0.0.0.0', port=8080)


if __name__ == '__main__':
    main()
