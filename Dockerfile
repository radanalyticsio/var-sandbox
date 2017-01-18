FROM elmiko/var-sandbox-base

COPY . /opt/var-sandbox

WORKDIR /opt/var-sandbox

USER root

RUN yarn install && yarn run build && pip install -r requirements.txt

USER 185

EXPOSE 8080
CMD yarn run start
