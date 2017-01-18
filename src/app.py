import uuid

import flask
from flask import json
from flask import views


app = flask.Flask(__name__)


class HTMLContent(views.MethodView):
    def get(self):
        return flask.render_template('index.html')


class PredictionAPI(views.MethodView):
    def post(self):
        data = flask.request.json
        data.update({
            'status': 'training',
            'id': uuid.uuid4().hex})
        return json.jsonify(data)


def main():
    app.add_url_rule('/', view_func=HTMLContent.as_view('html'))
    app.add_url_rule('/predictions', view_func=PredictionAPI.as_view('predictions'))
    app.run(host='0.0.0.0', port=8080, debug=True)


if __name__ == '__main__':
    main()
