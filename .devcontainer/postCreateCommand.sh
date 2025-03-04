#!/bin/bash

# Install a new version of npm, the VS Code Extension code generator and the extension manager
npm install -g npm yo generator-code @vscode/vsce

# Update the bash aliases for some more convenvience in the dev container terminal
echo 'alias ll="ls -al"' >> ~/.bash_aliases

echo '' >> ~/.bashrc
echo 'if [ -f ~/.bash_aliases ]; then' >> ~/.bashrc
echo '    . ~/.bash_aliases' >> ~/.bashrc
echo 'fi' >> ~/.bashrc
echo '' >> ~/.bashrc

source ~/.bashrc

# Install the npm packages
npm run install:all