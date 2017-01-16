FROM elmiko/yarn-base

COPY . /opt/var-sandbox

WORKDIR /opt/var-sandbox

RUN yarn install && yarn run build && pip3 install -r requirements.txt

EXPOSE 8080
CMD LC_ALL=en_US.utf8 LANG=en_US.utf8 FLASK_APP=app.py flask run --host=0.0.0.0 --port=8080
