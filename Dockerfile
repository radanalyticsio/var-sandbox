FROM elmiko/yarn-base

COPY . /opt/var-sandbox

WORKDIR /opt/var-sandbox

RUN yarn install && yarn run build && pip install -r requirements.txt

EXPOSE 8080
CMD yarn run start
