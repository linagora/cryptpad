FROM node:6-alpine

COPY . /cryptpad
COPY config.open-paas.js /cryptpad/config.js

WORKDIR /cryptpad

RUN apk add --no-cache git tini \
   && npm install --production \
   && npm install -g bower \
   && bower install --allow-root

EXPOSE 3000
EXPOSE 3001

VOLUME /cryptpad/datastore
VOLUME /cryptpad/customize

ENV USE_SSL=false
ENV STORAGE='./storage/file'
ENV LOG_TO_STDOUT=true

ENV CRYPTPAD_URL http://cryptpad.open-paas.org.local/
ENV CRYPTPAD_LOGOUT_URL http://auth.open-paas.org.local/?logout=1
ENV CRYPTPAD_OPENPAAS_API http://open-paas.org.local/api
ENV CRYPTPAD_OPENPAAS_SHARE_URL http://open-paas.org.local/unifiedinbox/mailto?uri=
CMD ["/sbin/tini", "--", "/cryptpad/container-start.sh"]
