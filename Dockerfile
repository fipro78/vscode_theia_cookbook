# Builder stage
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bullseye AS build

# install required tools to build the application
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends \
     make \
     gcc \
     pkg-config \
     build-essential \
     python3 \
     software-properties-common \
     libx11-dev \
     libxkbfile-dev \
     libsecret-1-dev \
     libssl-dev

RUN npm install -g @vscode/vsce @angular/cli

WORKDIR /home

# copy sources to the container
COPY ./angular-extension ./angular-extension
COPY ./react-extension ./react-extension
COPY ./vscode-extension ./vscode-extension
COPY ./custom-theme ./custom-theme
COPY ./theia ./theia
COPY package.json ./package.json

# set the GITHUB_TOKEN environment variable
# needed to avoid API rate limit when the build tries to download vscode-ripgrep
# see https://github.com/microsoft/vscode/issues/28434
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# run the build
RUN npm run install:all && \
    npm run build:all:browser && \
    cd theia && \
    rm package-lock.json && \
    rm -rf node_modules **/node_modules

# create the execution image
FROM node:${NODE_VERSION}-bullseye-slim

# Create theia user and directories
# Application will be copied to /home/theia
# Default workspace is located at /home/project
RUN adduser --system --group theia
RUN chmod g+rw /home && \
     mkdir -p /home/project && \
     chown -R theia:theia /home/theia && \
     chown -R theia:theia /home/project;

# Install required tools for application
RUN apt-get update && \
     apt-get install -y \
     openssh-client \
     openssh-server \
     libsecret-1-0 && \
     apt-get clean

ENV HOME=/home/theia \
     THEIA_DEFAULT_PLUGINS=local-dir:/home/theia/plugins \
     THEIA_WEBVIEW_EXTERNAL_ENDPOINT="{{hostname}}"

WORKDIR /home/theia

# Copy application from build stage
COPY --from=build --chown=theia:theia /home/theia/browser-app /home/theia/browser-app
COPY --from=build --chown=theia:theia /home/theia/plugins /home/theia/plugins

EXPOSE 3000

# Switch to Theia user
USER theia

# Launch the backend application via node
ENTRYPOINT [ "node", "/home/theia/browser-app/lib/backend/main.js" ]

# Arguments passed to the application
CMD [ "/home/project", "--hostname=0.0.0.0" ]