#!/bin/bash

# Install a new version of npm, the VS Code Extension code generator and the extension manager
npm install -g npm yo generator-code @vscode/vsce @angular/cli generator-theia-extension npm-check-updates

# Install Theia dependencies
sudo apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && sudo apt-get -y install --no-install-recommends \
    make \
    gcc \
    pkg-config \
    build-essential \
    python3.11 \
    software-properties-common \
    libx11-dev \
    libxkbfile-dev \
    libsecret-1-dev \
    libssl-dev

# Update the bash aliases for some more convenvience in the dev container terminal
echo 'alias ll="ls -al"' >> ~/.bash_aliases

echo '' >> ~/.bashrc
echo 'if [ -f ~/.bash_aliases ]; then' >> ~/.bashrc
echo '    . ~/.bash_aliases' >> ~/.bashrc
echo 'fi' >> ~/.bashrc
echo '' >> ~/.bashrc

echo '# Load Angular CLI autocompletion.' >> ~/.bashrc
echo 'source <(ng completion script)' >> ~/.bashrc

source ~/.bashrc

# Install the npm packages
npm run install:all