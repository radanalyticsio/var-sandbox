"""Value at Risk sandbox application.

This application is a self-contained HTTP server and Apache Spark
processing engine based on the algorithms present in the Value at Risk
Jupyter notebook (https://github.com/radanalyticsio/workshop).
"""

import multiprocessing as mp
import os
import random
import threading
import uuid

import flask
from flask import json
from flask import views
import flask_socketio as io


# Functions inspired by code in the notebook
# ---------------------------------------------------------------------
# All the following functions have been written by taking their source
# from the Value at Risk notebook which accompanies this application
# in the workshop training materials. Please see the docstring comment
# at the top of this file for the location of the notebook source.


def portfolio_value(pf):
    """Given a dictionary of stock values, return the total value."""
    return sum([v for v in pf.values()])


def seeds(count):
    """Return a list of random values of the specificed length."""
    return [random.randint(0, 1 << 32 - 1) for i in range(count)]


def simstep(pf, params, prng):
    """Simulate a single step of activity for a stock.

    This function takes a dictionary of stock value data, a dictionary
    containing stock prediction models, and a random.Random instance to
    generate new variances from. It will return a dictionary with the
    updated, randomly predicted, values for the stocks indexed by
    symbol.
    """
    def daily_return(sym):
        from scipy.stats import t
        df, loc, scale = params[sym]
        change = (t.ppf(prng.uniform(0, 1), df=df, loc=loc, scale=scale) + 100) / 100.0
        return change
    return {s: daily_return(s) * v for s, v in pf.items()}


def simulate(seed, pf, params, days):
    """Simulate a number of days worth of stock changes.

    This function accepts a seed for the randomizer, a dictionary of
    stock value data, a dictionary of stock prediction models, and a
    number of days to simulate. It will return a dictionary with the
    updated stock value predictions indexed by symbol.
    """
    prng = random.Random()
    prng.seed(seed)
    pf = pf.copy()
    for day in range(days):
        pf = simstep(pf, params, prng)
    return pf


def processing_loop(spark_master, input_queue, output_queue, wikieod_file):
    """Create a model and process requests for new predictions.

    This function is the heart of the application. It accepts a URL to
    a Spark master, multiprocessing input and output Queue objects, and
    the location of the end of day stock data in parquet format. With
    this information it will load the end of day data and create a
    model to base future predictions upon.

    After creating the model, it will enter a blocking loop waiting for
    new prediction requests to arrive. After receiving a new request,
    it will simulate the requested stock predictions and place the
    results into the output queue.

    It is important to note that this function will run as a separate
    process started by the main function. This is done to isolate the
    Spark processing components from the thread of execution that is
    running the Flask web server. In this manner the application will
    be reactive to incoming input without blocking on the processing
    activity.
    """
    # import these here to allow the debug mode to function properly in the
    # absence of spark
    import pyspark
    from pyspark import sql as pysql
    from pyspark.sql import functions as pyfuncs
    from scipy.stats import t

    spark = pysql.SparkSession.builder.master(spark_master).getOrCreate()
    sc = spark.sparkContext

    output_queue.put('ready')

    df = spark.read.load(wikieod_file)
    ddf = df.select('ticker', 'date', 'close').withColumn(
        'change', (pyfuncs.col('close') / pyfuncs.lag('close', 1).over(
        pysql.Window.partitionBy('ticker').orderBy(
        df['date'])) - 1.0) * 100)
    
    changes = ddf.groupBy("ticker").agg(pyfuncs.collect_list("change").alias("changes"))
    
    dist_map = changes.rdd.map(lambda r: (r[0], t.fit(r[1]))).collectAsMap()

    priceDF = ddf.orderBy('date', ascending=False).groupBy('ticker').agg(
        pyfuncs.first('close').alias('price'),
        pyfuncs.first('date').alias('date'))
    prices = priceDF.rdd.map(lambda r: (r[0], r[1])).collectAsMap()

    while True:
        req = input_queue.get()
        portfolio = {}
        for stock in req['stocks']:
            portfolio[stock['symbol']] = (
                prices[stock['symbol']] * stock['quantity'])

        seed_rdd = sc.parallelize(seeds(10000))
        bparams = sc.broadcast(dist_map)
        bpf = sc.broadcast(portfolio)
        initial_value = portfolio_value(portfolio)
        results = seed_rdd.map(lambda s:
            portfolio_value(simulate(s, bpf.value, bparams.value, req['days']))
            - initial_value)
        simulated_results = list(zip(results.collect(), seed_rdd.collect()))
        simulated_values = [v for (v, _) in simulated_results]
        simulated_values.sort()
        num_samples = req['simulations'] if req['simulations'] < 100 else 100
        prediction = [
            simulated_values[int(len(simulated_values) * i / num_samples)]
            for i in range(num_samples)]
        percentage_var = 0.05
        fivepercent = '{:0.2f}'.format(simulated_values[int(len(simulated_values) * percentage_var)])
        req.update({
            'status': 'ready',
            'fivepercent': fivepercent,
            'prediction': prediction})
        output_queue.put(req)


# - End of notebook inspired functions --------------------------------


# The following classes and functions are used to create the Flask
# HTTP server, and run the application.
# ---------------------------------------------------------------------


class BrandLogo(views.MethodView):
    """This class returns the brand logo svg content."""

    def get(self):
        return flask.send_from_directory(
            'static/img', 'brand-var.svg', mimetype='image/svg+xml')


class HTMLContent(views.MethodView):
    """The view class for the root index page."""

    def get(self):
        return flask.render_template('index.html')


class PredictionAPI(views.MethodView):
    """The view class for the prediction rest API.

    This class handles the POST requests to the sandbox for starting
    new value at risk caluclations. When a new request is received, it
    is placed in the multiprocess queue for the processing loop.
    """

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


def debug_processing_loop(input_queue, output_queue):
    """A simple printer to help with debugging.

    This function is used with the debug option to disable Spark
    processing and simply print the requests for predictions.
    """
    import time
    output_queue.put('ready')
    while True:
        req = input_queue.get()
        print('received -- {}'.format(req))
        time.sleep(2)
        req.update({'status': 'ready'})
        output_queue.put(req)


def responder_loop(socketio, output_queue):
    """Send websocket signals to the front end.

    This function will process predictions that have finished and relay
    them to the browser front end using socketio websockets.
    """
    dont_stop = True
    while dont_stop:
        res = output_queue.get()
        if res == 'STOP':
            dont_stop = False
        else:
            socketio.emit('update', json.dumps(res))


def main():
    """Start the application and processes.

    The main function will pull together the environment variables,
    start the process for the prediction loop, start the thread for the
    socketio responder, and setup the Flask HTTP server.
    """
    spark_master = os.environ.get('SPARK_MASTER', 'local[*]')
    wikieod_file = os.environ.get('WIKIEOD_FILE', '/data/wikieod.parquet')
    debug_mode = os.environ.get('VAR_DEBUG', False)

    input_queue = mp.Queue()
    output_queue = mp.Queue()

    if debug_mode:
        process = mp.Process(target=debug_processing_loop,
            args=(input_queue, output_queue))
    else:
        process = mp.Process(target=processing_loop,
            args=(spark_master, input_queue, output_queue, wikieod_file))

    process.start()
    output_queue.get()

    app = flask.Flask(__name__)
    app.config['SECRET_KEY'] = 'secret!'
    app.add_url_rule('/', view_func=HTMLContent.as_view('html'))
    app.add_url_rule('/img/brand-var.svg', view_func=BrandLogo.as_view('logo'))
    app.add_url_rule('/predictions',
                     view_func=PredictionAPI.as_view('predictions',
                                                     input_queue))

    socketio = io.SocketIO(app)
    thread = threading.Thread(
        target=responder_loop, args=(socketio, output_queue))
    thread.start()
    try:
        print('server running on 0.0.0.0:8080, press Ctrl-C to stop')
        print('spark master = {}'.format(spark_master))
        print('wikieod file = {}'.format(wikieod_file))
        socketio.run(app, host='0.0.0.0', port=8080)
    except KeyboardInterrupt:
        output_queue.put('STOP')


# ---------------------------------------------------------------------


if __name__ == '__main__':
    main()
