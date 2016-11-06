FROM node:6
MAINTAINER Benjamin Bouvier <public@benj.me>

# Globally install Weboob and its dependencies.
RUN apt-get update && \
    apt-get install -y git python python-setuptools python-dev libffi-dev \
    libxml2-dev libxslt-dev libyaml-dev libtiff-dev libjpeg-dev zlib1g-dev \
    libfreetype6-dev libwebp-dev build-essential gcc g++;

RUN git clone git://git.symlink.me/pub/weboob/devel.git /tmp/weboob \
    && cd /tmp/weboob \
    && python ./setup.py install \
    && rm -rf /tmp/weboob

# Setup kresus layout.
RUN useradd -d /home/user -m -s /bin/bash -U user

USER user

RUN mkdir -p /home/user/data
VOLUME /home/user/data

RUN mkdir -p /home/user/app
WORKDIR /home/user/app

# Install app dependencies.
COPY package.json package.json
RUN npm install --production

# Copy source.
COPY build /home/user/app/build
COPY bin /home/user/app/bin

USER root
RUN chown user:user -R /home/user
USER user

# Run server.
ENV HOST 0.0.0.0
ENV KRESUS_DIR /home/user/data
CMD bin/kresus.js

# Expose the port on which Kresus is running.
EXPOSE 9876