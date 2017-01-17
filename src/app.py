import uuid

import flask
from flask import json
from flask import views


app = flask.Flask(__name__)


@app.route('/')
def index():
    return flask.render_template('index.html')


class PredictionAPI(views.MethodView):
    def post(self):
        data = flask.request.json
        data.update({
            'status': 'training',
            'id': uuid.uuid4().hex})
        return json.jsonify(data)


app.add_url_rule('/predictions', view_func=PredictionAPI.as_view('predictions'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
