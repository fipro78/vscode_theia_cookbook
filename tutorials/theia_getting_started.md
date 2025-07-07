# Getting Started with Eclipse Theia

In my blog post [Getting Started with Visual Studio Code Extension Development](vscode_extension_webview_getting_started.md) I explained how to implement a Visual Studio Code Extension that contributes a custom editor using the Webviews API and different Javascript frameworks.
Implementing a Visual Studio Code Extension means to buy-in to the Microsoft Visual Studio Code product world. At least at first sight.
By creating an application based on the [Eclipse Theia Platform](https://theia-ide.org/theia-platform/) it is possible to build up tools that are similar to Visual Studio Code, but with some differences regarding features, extensibility and customization, privacy and deployment. It reuses components from the [VS Code Open Source project](https://github.com/microsoft/vscode) and provides additional modules that add features that are otherwise only available in Visual Studio Code because of license restrictions.
It is also possible to integrate Visual Studio Code Extensions to a Theia Application, and therefore it is an alternative for the deployment of the developed Visual Studio Code Extension.

If you are interested in a more detailed comparison between Visual Studio Code and Eclipse Theia, have a look at the following articles:

- [Eclipse Theia vs. VS Code OSS](https://eclipsesource.com/blogs/2023/09/08/eclipse-theia-vs-code-oss/)
- [The Theia IDE vs VS Code](https://eclipsesource.com/blogs/2024/07/12/vs-code-vs-theia-ide/)
- [Is Forking VS Code a Good Idea?](https://eclipsesource.com/blogs/2024/12/17/is-it-a-good-idea-to-fork-vs-code/)

In this tutorial I will show how to:

- Create an Eclipse Theia Application
- Integrate a Visual Studio Code Extensions to a Theia Application
- Extend/Customize the Theia Application via a Theia Extension
- Containerize a Theia Application

## Dev Container

To be able to build a Theia application, several tools and libraries need to be available.
As I created a Dev Container for the development of Visual Studio Code Extensions in my previous blog post, let's follow this path further and extend the existing Dev Container.

- Open the file _.devcontainer/postCreateCommand.sh_

  - Add the Theia code generator `generator-theia-extension` to the initial global `npm install` instruction
  - Install the necessary Theia dependencies

  ```shell
  #!/bin/bash

  # Install a new version of npm, the Visual Studio Code Extension code generator, the extension manager,
  # the Angular CLI and the Theia code generator
  npm install -g npm yo generator-code @vscode/vsce @angular/cli generator-theia-extension

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
  ```

  _**Note:**_  
  If you have chosen to use a _Dockerfile_ instead of a _postCreateCommand.sh_ script file, the installation of the dependencies and the Theia code generator need to be added to the _Dockerfile_ by using `RUN` commands of course.

  ```Dockerfile
  # Install Theia dependencies
  RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
      && apt-get -y install --no-install-recommends \
      make \
      gcc \
      dos2unix \
      pkg-config \
      build-essential \
      python3.11 \
      software-properties-common \
      libx11-dev \
      libxkbfile-dev \
      libsecret-1-dev \
      libssl-dev

  # Install a new version of npm, the Visual Studio Code Extension code generator, the extension manager,
  # the Angular CLI and the Theia code generator
  RUN npm install -g npm yo generator-code @vscode/vsce @angular/cli generator-theia-extension
  ```

- Rebuild the Dev Container to get the additional dependencies installed

Further details for building a Theia application are described in [How to build Theia and the example applications](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md).

#### Alternative: Local installation on Windows

If you prefer to develop on Windows instead of using the Dev Container, you need to prepare your local environment.
This is also necessary if you want to build the Theia Electron Desktop app, as you typically build for the OS you are running the build on.
That means, you need to build on Windows if you want to create a Windows Desktop application.

- Install [`scoop`](https://github.com/lukesampson/scoop#installation).
- Install [`nvm`](https://github.com/coreybutler/nvm-windows) with scoop: `scoop install nvm`.
- Install Node.js with `nvm`: `nvm install lts`, then use it: `nvm use lts`. You can list all available Node.js versions with `nvm list available` if you want to pick another version.
- Install [Python](https://www.python.org/downloads/windows/) with `pip`
- Set the environment variable `PYTHON` to the _python.exe_
- Add the Python installation folder and the _Scripts_ folder to the `PATH`
- Install `distutils` module: `pip install setuptools`  
  Needed to install python packages for node gyp, but was removed in Python v3.12
- Install the Visual Studio [build tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with _Desktop development with C++_

This is also described in (Theia - Developing - Building on Windows)[https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#building-on-windows]

Additionally you need to configure the project environment, similar to what is done in the Dev Container.

- Install code generator for Visual Studio Code and Theia Extensions and install the dependencies

  ```
  npm install -g npm yo generator-code @vscode/vsce @angular/cli generator-theia-extension
  ```

## Create the Theia application structure

A Theia Application project consists of multiple packages.
There are two projects for the application (browser and desktop) and typically at least one extension project.
Of course this is dependent on the use case.
You could also build up the Theia Application with only Theia dependencies and Visual Studio Code Extensions.

As this tutorial is part of my _Visual Studio Code Extension - Theia - Cookbook_, I will setup a **Multi Module Repository** (monorepo) that contains the Visual Studio Code Extensions sources and the Theia related sources in one place.
For other projects it might be more useful to keep the extension sources and the Theia app sources in separate repositories. Especially if the extension should be consumeable by different applications.

To avoid dependency collisions between the Visual Studio Code Extension projects and the Theia projects
(e.g. different versions of `webpack`, different `copy-webpack-plugin` versions, `mocha` vs `jasmine`), the projects should be separated and not combined with a common workspace setting.

- Open a **Terminal**
- Create a new subfolder _theia_ in the project root
- Switch to that folder
- Create the Theia App Modules by using the `theia-extension` generator

  ```
  yo theia-extension
  ```

- Select the type **No Extension (just a Theia application)**

_**Note:**_  
If you generated the Theia application structure with a `generator-theia-extension` Version < 0.1.45 and `yarn` is not installed in your system, the code generation will fail with an error when trying to spawn `yarn`.
In that case you first need to follow the steps described in [Yarn vs NPM](#yarn-vs-npm).  
If you use `generator-theia-extension` Version >= 0.1.45 there should be no `yarn` dependencies anymore in the generated sources.

The `generator-theia-extension` creates two new modules _browser-app_ and _electron-app_ inside the _theia_ folder.
Additionally there are some project files

- _theia/lerna.json_  
  [Lerna](https://lerna.js.org/) is a fast, modern build system for managing and publishing multiple JavaScript/TypeScript packages from the same repository. There is no need to change anything here.
- _theia/.gitignore_  
  The _.gitignore_ file for the _theia_ folder. Dependent on your strategy to handle _.gitignore_ you can simply keep the file or move the content to the _.gitignore_ file in the root folder. For the later you need of course to adapt the entries with the _theia_ folder prefix.
- _theia/package.json_  
  The _package.json_ for the Theia projects. It makes use of the `workspaces` feature of the package manager ([npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) / [yarn workspaces](https://yarnpkg.com/features/workspaces))
- _theia/README.md_  
  The generated README file that contains some basic information about building and running the Theia application.
- _theia/.vscode/launch.json_ that contains some launch scripts. They need to be moved to the main _.vscode/launch.json_ and modified to work correctly.

  - Copy the two configurations to _.vscode/launch.json_
  - Replace `${workspaceRoot}` with `${workspaceRoot}/theia` to have the correct file links in the configurations
  - Delete the folder _theia/.vscode_

### Yarn vs NPM

Since Theia 1.58.0 `npm` is used to build Theia instead of `yarn`, which was used before see ([Use npm instead of yarn to build Theia](https://github.com/eclipse-theia/theia/pull/14481)).
The [Eclipse Theia Generator](https://www.npmjs.com/package/generator-theia-extension) recently was updated to use `npm` instead of `yarn`. You need at least version 0.1.45 to get the Theia sources generated that use `npm`. If you are unsure which version of the Eclipse Theia Generator you have globally installed, you can check it via

```
npm ls --depth=0 -global
```

If you have an older version (e.g. because you are using a Dev Container that was created some time ago) you can update the Eclipse Theia Generator via

```
npm install -g generator-theia-extension@latest
```

#### Update an existing project

In case you have an existing Theia project that still uses `yarn` and you want to use only one package manager in our setup, perform the following updates to use `npm` instead of `yarn`:

- Update _theia/lerna.json_  
  Change `npmClient` to `npm`
- _theia/package.json_
  - Update the `engines`
    ```json
    "engines": {
      "npm": ">=10.0.0",
      "node": ">=18"
    },
    ```
  - Update the `scripts`
    - Replace `yarn --cwd` with `npm --prefix`
    - Add `run` between the folder and the script
    ```json
    "scripts": {
      "build:browser": "npm --prefix browser-app run bundle",
      "build:electron": "npm --prefix electron-app run bundle",
      "prepare": "lerna run prepare",
      "postinstall": "theia check:theia-version",
      "start:browser": "npm --prefix browser-app run start",
      "start:electron": "npm --prefix electron-app run start",
      "watch:browser": "lerna run --parallel watch --ignore electron-app",
      "watch:electron": "lerna run --parallel watch --ignore browser-app"
    },
    ```
- _theia/browser-app/package.json_
  - Replace `yarn rebuild` with `npm run rebuild`
  - Add prepare scripts
    ```json
    "prepare": "npm run clean && npm run build",
    "clean": "theia clean",
    "build": "theia build --mode development"
    ```
- _theia/electron-app/package.json_
  - Replace `yarn rebuild` with `npm run rebuild`
  - Add prepare scripts
    ```json
    "prepare": "npm run clean && npm run build",
    "clean": "theia clean",
    "build": "theia build --mode development"
    ```
- Delete the file _theia/yarn.lock_

### Optional: Define Tasks

- Open the file _.vscode/tasks.json_
- Add the following task definitions

  ```json
  {
      "label": "Build Theia Browser",
      "type": "npm",
      "script": "build:browser",
      "isBackground": true,
      "group": "build",
      "options": {
          "cwd": "${workspaceFolder}/theia"
      }
  },
  {
      "label": "Start Theia Browser",
      "type": "npm",
      "script": "start:browser",
      "isBackground": true,
      "options": {
          "cwd": "${workspaceFolder}/theia"
      }
  },
  {
      "label": "Watch Theia Browser",
      "type": "npm",
      "script": "watch:browser",
      "isBackground": true,
      "problemMatcher": {
          "owner": "typescript",
          "pattern": "$tsc",
          "background": {
              "activeOnStart": true,
              "beginsPattern": {
                  "regexp": "(.*?)"
              },
              "endsPattern": {
                  "regexp": "browser-app: webpack (.*?) compiled successfully"
              }
          }
      },
      "options": {
          "cwd": "${workspaceFolder}/theia"
      }
  },
  {
      "label": "Watch and Start Theia Browser",
      "dependsOrder": "sequence",
      "dependsOn": [
          "Watch Theia Browser",
          "Start Theia Browser"
      ],
      "problemMatcher": []
  },
  {
    "label": "Build Theia Electron",
    "type": "npm",
    "script": "build:electron",
    "isBackground": true,
    "group": "build",
    "options": {
      "cwd": "${workspaceFolder}/theia"
    }
  },
  {
    "label": "Start Theia Electron",
    "type": "npm",
    "script": "start:electron",
    "isBackground": true,
    "options": {
      "cwd": "${workspaceFolder}/theia"
    }
  },
  {
    "label": "Watch Theia Electron",
    "type": "npm",
    "script": "watch:electron",
    "isBackground": true,
    "problemMatcher": {
      "owner": "typescript",
      "pattern": "$tsc",
      "background": {
        "activeOnStart": true,
        "beginsPattern": {
          "regexp": "(.*?)"
        },
        "endsPattern": {
          "regexp": "electron-app: webpack (.*?) compiled successfully"
        }
      }
    },
    "options": {
      "cwd": "${workspaceFolder}/theia"
    }
  },
  {
    "label": "Watch and Start Theia Electron",
    "dependsOrder": "sequence",
    "dependsOn": ["Watch Theia Electron", "Start Theia Electron"],
    "problemMatcher": []
  }
  ```

This step is optional, because you can perform those steps also from a **Terminal** window.
I personally like to work with the [Task Explorer](https://marketplace.visualstudio.com/items?itemName=spmeesseman.vscode-taskexplorer) Visual Studio Code Extension, which is added to the Dev Container configuration in my example.
Using this extension you can trigger the task _Build Theia Browser_ and _Start Theia Browser_ from the _Task Explorer_ tree view.

#### Interlude: Dependency Hell

From my experience over the last months, the dependency management with npm is a nightmare! I often followed my own notes to create a new Theia application from scratch, and suddenly came across some issues because of version updates in dependent modules.
One was for example an incompatible `node-abi` version. Somehow the newest version was pulled on creating a new Theia application stub via the generator, which then failed because the current `node-abi` version required `node@>=22.12.0` while the Dev Container was using `node@20.18.1`. Another example was a breaking change in `inversify`, and creating a new application and pulling the latest version caused compile errors on the way.

Of course the correct solution is that the downstream projects fix their dependencies, which for example happened in Theia via [PR 14435](https://github.com/eclipse-theia/theia/pull/14435) or [Issue 15139](https://github.com/eclipse-theia/theia/issues/15139).
As an intermediate solution you can pin the version of a dependency that breaks in its newest version by configuring a [Selective Version Resolution](https://github.com/yarnpkg/rfcs/blob/master/implemented/0000-selective-versions-resolutions.md).
This means to add a `resolutions` field to the _package.json_ and define the version override.
As an example, to pin the version of `node-abi` to 3.74.0, which was used in the `electron-rebuild` version used by Theia, you could add the following snippet to the _theia/package.json_:

```json
"resolutions": {
  "node-abi": "3.74.0"
},
```

### Verify

To verify that the intial Theia application setup works, let's build and start the Theia browser application.

If you created the tasks as explained in [Optional: Define Tasks](#optional-define-tasks) you can either

- Press **F1**
  - Select `Tasks: Run Task`
  - Select `Build Theia Browser` to build the Theia browser application
  - Select `Start Theia Browser` to start the Theia browser application
- Use the [Task Explorer](https://marketplace.visualstudio.com/items?itemName=spmeesseman.vscode-taskexplorer) Visual Studio Code Extension
  - Expand _vscode_theia_cookbook - vscode_ in the _Task Explorer_ view
  - Run the `Build Theia Browser` task from the tree to build the Theia browser application
  - Run the `Start Theia Browser` task from the tree to start the Theia browser application

If you want to work with the Terminal and execute the `npm` scripts manually

- Open a **Terminal**
- Switch to the _theia_ folder
- Run `npm run build:browser` to build the Theia browser application
- Run `npm run start:browser` to start the Theia browser application

_**Note:**_  
You can also use the _Launch Configuration_ from the _.vscode/launch.json_ via _Run and Debug_. This will start the application and enable debugging. But you first need to build the application via commandline or Task. The debugging topic will be covered at a later time in this blog post.

Once started, you can open a browser on http://localhost:3000 and see the started Theia application.

#### Interlude: JavaScript heap out of memory

If you phase a **JavaScript heap out of memory** error on building the browser-app, you probably need to increase the memory limit in Node.js.
This can be done via the [`--max-old-space-size`](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-mib) command line option.

- Open _.devcontainer/devcontainer.json_
- Add the following `NODE_OPTIONS` via the `containerEnv` property

```json
  "containerEnv": {
    "NODE_OPTIONS": "--max-old-space-size=8192"
  },
```

- Rebuild the dev container and verify if the memory issue is resolved.

### Script Updates

To get the Theia dependencies installed when creating a new Dev Container, update the `install:all` script.

- Update the _package.json_ in the repository root

```json
{
  "name": "vscode-theia-cookbook",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "install:all": "cd vscode-extension && npm install && cd ../angular-extension && npm run install:all && cd ../react-extension && npm run install:all && cd ../theia && npm install"
  }
}
```

## Theia - Visual Studio Code Extension

As already mentioned, Theia is compatible with Visual Studio Code Extensions.
This means it is possible to build a custom tool based on Eclipse Theia that integrates the Visual Studio Code Extensions that were created in the previous blog post.

In this section we will extend the Theia Application that we just created with the Visual Studio Code Extensions created in the previous blog post.

- Add support for Visual Studio Code Extensions to the Theia application.

  - Update the _package.json_ of the _browser-app_ and the _electron-app_

    - Open a **Terminal**
    - Switch to the Theia Application directory (_theia/browser-app_ and _theia/electron-app_)

    - Add `@theia/plugin-ext` as a dependency for the webview support

      ```
      npm install @theia/plugin-ext
      ```

      _**Note:**_  
      By including `@theia/plugin-ext` all Theia packages and their dependencies to which plugins/extensions can contribute are added. This can be quite a lot compared to the initially created application and might even introduce dependencies you would not directly have thought of (e.g. `@theia/ai-mcp` and `@theia/ai-core`).

    - Add `@theia/plugin-ext-vscode` as a dependency

      ```
      npm install @theia/plugin-ext-vscode
      ```

    - Open the _package.json_ of the application project

      - Specify the location of the plugins that should be loaded on initialization via the `--plugins` option of the `start` script. We add them on the same level as the application projects, to have a single location for our workspace.

      - Add a script `download:plugins` to download the plugins
      - Add scripts to perform a clean build in a `prepare` script and additionally download the plugins

      - Configure the options to pre-install Visual Studio Code Extensions

        - `theiaPluginsDir` - the folder in which the pre-installed extensions are located
        - `theiaPlugins`- list of published vs code extension urls, can be empty here, because we will pre-install our extension manually

      ```json
      "scripts": {
        "prepare": "npm run clean && npm run build && npm run download:plugins",
        "clean": "theia clean",
        "build": "theia build --mode development",
        "download:plugins": "theia download:plugins",
        "bundle": "npm run rebuild && theia build --mode development",
        "rebuild": "theia rebuild:browser --cacheRoot ..",
        "start": "theia start --plugins=local-dir:../plugins",
        "watch": "npm run rebuild && theia build --watch --mode development"
      },
      "theiaPluginsDir": "../plugins",
      "theiaPlugins": {},
      ```

    - Build the Theia applications to take up the updated dependencies

      - Open a **Terminal**
      - Switch to the _theia_ directory
      - Execute the following commands to trigger the application builds.

        ```
        npm run build:browser
        npm run build:electron
        ```

      _**Note:**_  
      If you created the tasks as described before, you can of course use the the tasks to perform the application build.

  - Open the file _.vscode/launch.json_
    - Locate the _Start Browser Backend_ configuration
      - Add `"--plugins=local-dir:${workspaceRoot}/theia/plugins"` to the `args`
    - Locate the _Start Electron Backend_ configuration
      - Add `"--plugins=local-dir:${workspaceRoot}/theia/plugins"` to the `args`

- Pre-install the Visual Studio Code extensions  
  You have basically two options:

  - Option 1: Symbolic Links  
    Use [`symlink-dir`](https://www.npmjs.com/package/symlink-dir) to link the extension to the _plugin_ folder location of the Theia application as described in [Developing VS Code Extensions in a Theia Project](https://theia-ide.org/docs/authoring_vscode_extensions/#developing-vs-code-extensions-in-a-theia-project)

    - Open a **Terminal**
    - Switch to the _vscode-extension_ directory
    - Add the following packages as `devDependencies`

      - [`rimraf`](https://www.npmjs.com/package/rimraf) to delete the directory

        ```
        npm i -D rimraf
        ```

      - [`symlink-dir`](https://www.npmjs.com/package/symlink-dir) to create a symbolic link

        ```
        npm i -D symlink-dir
        ```

    - Open the file _vscode-extension/package.json_ and add the following `scripts`

      ```json
      "scripts": {
        "prepare": "npm run clean && npm run vscode:prepublish && npm run symlink",
        "clean": "rimraf ../theia/plugins/vscode-extension",
        "symlink": "symlink-dir . ../theia/plugins/vscode-extension",
        ...
      }
      ```

    - Execute the `prepare` script

      ```
      npm run prepare
      ```

    - Verify that the symbolic link to the _vscode-extension_ folder is created in _theia/plugins_
    - Repeat the above steps for _angular-extension_ and _react-extension_. Remember to update the folder references in the `clean` and the `symlink` scripts to match the extension.

    _**Note:**_  
    The `prepare` script is a life cycle script that is automatically executed at various points which is described in [Life Cycle Scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts#life-cycle-scripts). By adding the `prepare` script, the `install:all` scripts in _angular-extension_ and _react-extension_ will fail because of the execution order. There are two solutions for this issue:

    1. Change the order in the `install:all` scripts to first call `npm install` in the _webview-ui_ folder

       ```json
       "scripts": {
         "install:all": "cd webview-ui && npm install && cd .. && npm install",
         ...
       }
       ```

    2. Call `npm install` with the `--ignore-scripts` flag

       ```json
       "scripts": {
         "install:all": "npm install --ignore-scripts && cd webview-ui && npm install",
         ...
       }
       ```

  - Option 2: VSIX  
    This means to create the _.vsix_ extension package file and extract it to the _plugins_ folder manually. This has the advantage that the result is the same as if you install a Visual Studio Code extension from a marketplace. So it is a real integration test and makes it easier to create a container image as I will show later.

    - Switch to the _vscode-extension_ folder in a Terminal
    - Add the following packages as `devDependencies`

      - [`mkdirp`](https://www.npmjs.com/package/mkdirp) to create the directory

        ```
        npm i -D mkdirp
        ```

      - [`rimraf`](https://www.npmjs.com/package/rimraf) to delete the directory

        ```
        npm i -D rimraf
        ```

      - [`run-script-os`](https://www.npmjs.com/package/run-script-os) to execute the unzip operation in an OS dependent way

        ```
        npm i -D run-script-os
        ```

    - Open the file _vscode-extension/package.json_ and add the following `scripts`

      ```json
      "scripts": {
        ...
        "clean": "rimraf ../theia/plugins/vscode-extension",
        "package": "vsce package --allow-missing-repository",
        "theia:prepare-app": "npm run package && npm run theia:extract-vsix",
        "theia:extract-vsix": "npm run clean && npm run theia:prepare && npm run unzip",
        "theia:prepare": "mkdirp ../theia/plugins/vscode-extension",
        "unzip": "run-script-os",
        "unzip:windows": "tar -xf vscode-extension-0.0.1.vsix -C ../theia/plugins/vscode-extension",
        "unzip:nix": "unzip vscode-extension-0.0.1.vsix -d ../theia/plugins/vscode-extension"
      },
      ```

    - Execute `npm run theia:prepare-app` on the commandline of the _vscode-extension_ project folder  
      This will build the project, package it to a _.vsix_ file and extract the file to the _theia/plugins_ folder.

      _**Note:**_  
      If you get the following error on running the script:

      ```
      It seems the README.md still contains template text. Make sure to edit the README.md file before you package or publish your extension.
      ```

      Open the _vscode-extension/README.md_ of the extension project that shows the error and delete the following sentence `This is the README for your extension "vscode-extension".`  
      Of course the real solution is to provide a meaningful README instead of the template. But for this tutorial, we can simply fix the error this way. Or simply delete the _README.md_ of the extension for this tutorial.

      To avoid the question about the license on packaging, add a LICENSE file to _vscode-extension_ folder with the information about the extension's license.

    - Verify that the folder _theia/plugins/vscode-extension_ is created and contains the content of the _.vsix_ file
    - Repeat the above steps for _angular-extension_ and _react-extension_. Remember to update the folder references according to the extension.

- Verify the installation of the extensions

  - Option 1: Via task _Start Theia Browser_
  - Option 2: Via Terminal
    - Run the Theia browser application
    - Open a **Terminal**
    - Switch to the _theia_ directory
    - Start the Theia browser application
      ```
      npm run start:browser
      ```
  - Open a browser and go to http://localhost:3000
  - Open the _Plugins_ view via _Menu - View - Plugins_
    - Verify that the _angular-extension_, the _react-extension_ and the _vscode-extension_ are listed in the _PLUGINS_ view.
  - Open a folder somewhere  
    For example, create a folder _example_ in the home directory of the _node_ user via **Terminal** of the Theia browser application.
  - Create a new file named _homer.person_
    - The file should open with a custom editor from the installed Visual Studio Code extensions.
    - Try to open the file with another editor via right click on the file, _Open With..._ and then selecting one of the provided editors  
      If you do not see the contributed custom editors in the list, try to rebuild the Theia browser application and start it again.

- Open the file _theia/.gitignore_
  - Add the _plugins_ folder to avoid that the _plugins_ are added to the repository.

### Possible issues with the Visual Studio Code webview integration in Theia

The following chapter contains some issues I came across when integrating a Visual Studio Code Extension in Theia.

#### Webview file URIs

If you use `path` or `fsPath` on the URI object of a file resource obtained via `webview.asWebviewUri`, you will get an incorrect value, because Theia prefixes the URL with `\webview\theia-resource\file\\\`.

This can be worked around with code like this:

```javascript
const fileUri = getUri(webview, this.context.extensionUri, [
  "webview-ui",
  "assets",
  "myFile.yaml",
]);

// workaround to fix file path issue with Theia
var filePath = fileUri.fsPath;
if (fileUri.fsPath.startsWith("\\webview\\theia-resource\\file\\\\\\")) {
  filePath = fileUri.fsPath.replace(
    "\\webview\\theia-resource\\file\\\\\\",
    ""
  );
}
```

This issue was already reported and will likely be fixed in an upcoming Theia release. [Issue #14727](https://github.com/eclipse-theia/theia/issues/14727)

#### Webviews not showing up in Theia

If the webviews do not show up on opening them, it could be an issue with the security settings related to the webview origin pattern.
The reason is that webviews in the browser app are shown in an `iframe`.
You can find further information in the [@theia/plugin-ext README](https://www.npmjs.com/package/@theia/plugin-ext?activeTab=readme).

Set `THEIA_WEBVIEW_EXTERNAL_ENDPOINT="{{hostname}}"` to switch to the unsecure mode for testing as described in the [Theia 0.13.0 Release Plan](https://projects.eclipse.org/projects/ecd.theia/releases/0.13.0/plan). For the productive deployment hosting the webview handlers on a sub-domain is more secure.

- Open the file _.devcontainer/devcontainer.json_
- Add the `containerEnv` variable
  ```json
  "containerEnv": {
    "THEIA_WEBVIEW_EXTERNAL_ENDPOINT": "{{hostname}}"
  },
  ```

_**Note:**_  
On opening the Theia app with the changed `THEIA_WEBVIEW_EXTERNAL_ENDPOINT`, you will see a notification at the bottom right, mentioning the potential security issue. This can be disabled by setting `"warnOnPotentiallyInsecureHostPattern": false`.

- Open _theia/browser-app/package.json_
- Add a `frontend` configuration to `theia`

  ```json
    "theia": {
      "target": "browser",
      "frontend": {
        "config": {
          "warnOnPotentiallyInsecureHostPattern": false
        }
      }
    }
  ```

#### Welcome views do not show content

This seems to be an issue in Theia and was already reported via [Issue #9361](https://github.com/eclipse-theia/theia/issues/9361).

A possible workaround is to register a `TreeDataProvider` which returns an empty tree.

## Consume third-party Visual Studio Code Extensions in Theia

In the previous section we integrated our Visual Studio Code Extension to the Theia application. Additionally you can consume third-party Visual Studio Code Extensions from the [Open VSX Registry](https://open-vsx.org/).

The first option to consume a Visual Studio Code Extension is to pre-install it at build-time. We have already prepared the _package.json_ files for this in the previous section by adding `theiaPlugins` and `theiaPluginsDir` and the `download:plugins` script.
Let's for example pre-install the [Eclipse Keymap](https://open-vsx.org/extension/alphabotsec/vscode-eclipse-keybindings) to help people like me that are coming from Eclipse and are used to the Eclipse keybindings:

_**Note:**_  
Only Microsoft products can use and connect to Microsoft’s Extension Marketplace. So it is not allowed to install extensions from there to a Theia application.
Further information can be found in this [article](https://www.eclipse.org/community/eclipse_newsletter/2020/march/1.php).
Also note that there are also some Extensions that are only allowed to be installed in Microsoft products,
e.g. [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) the language server for Python from Microsoft can not be installed in a Theia application.

- Open the file _theia/browser-app/package.json_

  - Add the following entry in the `theiaPlugins` section

    ```json
    "theiaPlugins": {
      "eclipse-keybindings": "https://open-vsx.org/api/alphabotsec/vscode-eclipse-keybindings/0.16.1/file/alphabotsec.vscode-eclipse-keybindings-0.16.1.vsix"
    },
    ```

    _**Note:**_  
    You find the link to the _.vsix_ file on the extension page with the **Download** button.

- Open the file _theia/electron-app/package.json_

  - Add the following entry in the `theiaPlugins` section

    ```json
    "theiaPlugins": {
      "eclipse-keybindings": "https://open-vsx.org/api/alphabotsec/vscode-eclipse-keybindings/0.16.1/file/alphabotsec.vscode-eclipse-keybindings-0.16.1.vsix"
    },
    ```

    _**Note:**_  
    You find the link to the _.vsix_ file on the extension page with the **Download** button.

- Open a Terminal
- Switch to the folder _theia_
- Execute `npm run prepare`  
  You could also run `npm install` which triggers the `prepare` script while processing, or switch to the _browser-app_ and _electron-app_ folders directly and only call `npm run download:plugins`.

If you now start the Theia application and open the _Plugins_ view via _Menu - View - Plugins_ you should see the _angular-extension_, the _react-extension_, the _vscode-extension_ and the _vscode-eclipse-keybindings_ listed in the _PLUGINS_ view.

At this time we **pre-installed** extensions. A user is not able to change this.
And users are still not able to install and uninstall additional extensions at runtime to customize their own instance of the application.
To enable this feature you need to add `@theia/vsx-registry` as a dependency.

- Open a Terminal
- Switch to the folder _theia/browser-app_

  - Add the dependency to `@theia/vsx-registry` via

    ```
    npm i @theia/vsx-registry
    ```

- Switch to the folder _theia/electron-app_

  - Add the dependency to `@theia/vsx-registry` via

    ```
    npm i @theia/vsx-registry
    ```

- Rebuild the Theia applications

If you now start the Theia application and open the _Extensions_ view via _Menu - View - Extensions_ you you are able to install additional extensions to your Theia instance. You might need to refresh the browser window.

_**Note:**_  
The pre-installed extensions still can not be uninstalled. This is intended, as you as a developer decided that the pre-installed extensions are required to make the application work as designed.
This should not be modifiable by a customer.

The above steps and further information are also described in

- [Consuming VS Code Extensions](https://theia-ide.org/docs/authoring_vscode_extensions/#consuming-vs-code-extensions)
- [Installing VS Code Extensions in Theia](https://theia-ide.org/docs/user_install_vscode_extensions/)

### Built-in Visual Studio Code Extensions

Visual Studio Code contains multiple pre-integrated extensions that make up several base functionalities of Visual Studio Code. To get an idea about those _builtin_ extension, you can open the _Extensions_ view in Visual Studio Code and type `@builtin` in the search field.

Those extensions are part of the [vscode repository](https://github.com/microsoft/vscode/tree/main/extensions).
To make them usable in Theia, there is the [vscode-builtin-extensions repository](https://github.com/eclipse-theia/vscode-builtin-extensions).
It packages those _builtins_ as _.vsix_ and publishes them to OpenVSX.

For example, to extend the Theia application for Typescript support, the following two builtin extensions need to be added:

- [TypeScript Language Basics (built-in)](https://open-vsx.org/extension/vscode/typescript)
- [TypeScript and JavaScript Language Features (built-in)](https://open-vsx.org/extension/vscode/typescript-language-features)

- Open the file _theia/browser-app/package.json_

  - Add the following entries in the `theiaPlugins` section

    ```json
    "theiaPlugins": {
      "eclipse-keybindings": "https://open-vsx.org/api/alphabotsec/vscode-eclipse-keybindings/0.16.1/file/alphabotsec.vscode-eclipse-keybindings-0.16.1.vsix",
      "vscode-typescript": "https://open-vsx.org/api/vscode/typescript/1.95.3/file/vscode.typescript-1.95.3.vsix",
      "vscode-typescript-language-features": "https://open-vsx.org/api/vscode/typescript-language-features/1.95.3/file/vscode.typescript-language-features-1.95.3.vsix"
    },
    ```

- Open the file _theia/electron-app/package.json_

  - Add the following entries in the `theiaPlugins` section

    ```json
    "theiaPlugins": {
      "eclipse-keybindings": "https://open-vsx.org/api/alphabotsec/vscode-eclipse-keybindings/0.16.1/file/alphabotsec.vscode-eclipse-keybindings-0.16.1.vsix",
      "vscode-typescript": "https://open-vsx.org/api/vscode/typescript/1.95.3/file/vscode.typescript-1.95.3.vsix",
      "vscode-typescript-language-features": "https://open-vsx.org/api/vscode/typescript-language-features/1.95.3/file/vscode.typescript-language-features-1.95.3.vsix"
    },
    ```

- Open a Terminal
- Switch to the folder _theia/browser-app_
- Execute `npm run download:plugins`  
  As the _browser-app_ and the _electron-app_ share the same _plugins_ folder in our setup, we only need to execute this for one app.

Start the Theia application and verify that syntax highlighting and code completion works for typescript files.
This can be done for example by opening the workspace folder you are currently working on in the Theia Application.

#### Builtin-Extension-Pack

To create a Theia application that provides the same functionality as vanilla Visual Studio Code, you can also install all builtin extensions by using the [builtin-extension-pack](https://open-vsx.org/extension/eclipse-theia/builtin-extension-pack).
In this case you should exclude the extensions that are not working in Theia via the `theiaPluginsExcludeIds` setting the the _package.json_.

The following snippet is quite the same as in the [_package.json_ of the Theia IDE](https://github.com/eclipse-theia/theia-ide/blob/ee401cffdff879de2a3ba02e332282e0d1eb8b4c/package.json#L63-L75) (without the Java Visual Studio Code Extensions):

```json
  "theiaPlugins": {
    "eclipse-theia.builtin-extension-pack": "https://open-vsx.org/api/eclipse-theia/builtin-extension-pack/1.95.3/file/eclipse-theia.builtin-extension-pack-1.95.3.vsix",
  },
  "theiaPluginsExcludeIds": [
    "ms-vscode.js-debug-companion",
    "VisualStudioExptTeam.vscodeintellicode",
    "vscode.extension-editing",
    "vscode.github",
    "vscode.github-authentication",
    "vscode.microsoft-authentication"
  ],
```

## Theia Customization

When you create a Visual Studio Code Extension, the intention is to add a new functionality to Visual Studio Code. Apart from adding new functionality, there is not much you can do to customize Visual Studio Code. Of course you can customize the color theme, which I will show later, and you can change some settings like key bindings etc. But you can for example not remove some basic functionality in Visual Studio Code or replace it with a customized variant. In Theia it is possible to remove or replace existing features to create a custom Theia Application.

In the following sections I will describe the different ways to customize a Theia Application. It is not intended as a recommendation what to do, more a description on how to customize it by example.

### Configuration

One first step in customizing a Theia Application is to configure it via _Application Properties_ and _Default Preferences_. Further information can be found in [ECLIPSE THEIA - CLI - Configure](https://github.com/eclipse-theia/theia/tree/master/dev-packages/cli#configure).

Let`s configure a custom application name for the Theia Application.

- Open _theia/browser-app/package.json_
- Add a `frontend` configuration to `theia` if it does not exist yet

  ```json
    "theia": {
      "target": "browser",
      "frontend": {
        "config": {
          "applicationName": "My Custom Theia Application",
          "warnOnPotentiallyInsecureHostPattern": false
        }
      }
    }
  ```

After rebuilding and starting the browser application, you will see the application name in the browser tab.

### Theia Extension for customization

If your goal is to create a Theia Application with custom functionality, the recommended way is to create a _Theia Extension_.
This gives you full access to Theia internals with almost no limitations in terms of accessible API.
Theia Extensions are installed at compile time and not intended to be installed at runtime in an existing Theia application.
And of course a Theia Extension can not be installed into Visual Studio Code, unlike the Visual Studio Code Extension that we created in the previous blog post.

A more detailed comparison of the different extension mechanisms that are possible with Theia is described in [Theia - Extensions and Plugins](https://theia-ide.org/docs/extensions/).

In the following section we create a Theia Extension that is used to customize the app.

- Open a Terminal
- Switch to the _theia_ folder
- Create a new Theia extension by using the `theia-extension` generator

  ```
  yo theia-extension
  ? The extension's type Empty
  ? The extension's name theia-customization
  ```

- Select `do not overwrite` (n) for every file that comes up with a conflict. It would otherwise remove all changes we applied before.

_**Note:**_  
If you have already committed the previous work, you could also let the generator overwrite those files and merge the changes manually of course.

- Make the necessary modifications manually

  - Update the _theia/package.json_ and add the new _theia-customization_ module to the `workspaces` section

    ```json
      "workspaces": [
        "theia-customization",
        "browser-app",
        "electron-app"
      ]
    ```

  - Add the _theia-customization_ module as a dependency to the _browser-app_ and the _electron-app_

    ```json
      "dependencies": {
        ...,
        "theia-customization": "0.0.0"
      },
    ```

  - Optional: Update the _theia-customization/package.json_
    - Replace `yarn` in the `scripts` section with `npm`  
      This is only necessary if you use a `generator-theia-extension` < 0.1.45
  - Run `npm install` to update the project after the manual modifications

Now you can create a customization, like adding a banner on top of the application shell or removing things from the application, like the Terminal.

### Replace an existing Theia implementation

The Theia framework uses dependency injection to wire up services and contribution points. This is described in more detail in [Services and Contributions](https://theia-ide.org/docs/services_and_contributions/). Because of this architectural design it is easy to contribute customizations that replace existing Theia implementations.

In the following section we will replace the Theia `ApplicationShell` with a custom implementation that adds a banner on top.

- Create a new folder _theia/theia-customization/src/browser/style_
- Create a new file _theia/theia-customization/src/browser/style/index.css_

  ```css
  :root {
    --brand-color1: rgb(53, 52, 52);
    --brand-color2: rgb(218, 122, 8);
  }

  #theia-app-shell {
    top: 2.8rem;
  }

  #example-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(
      to right,
      var(--brand-color1),
      var(--brand-color2)
    );
    color: white;
    padding: 0 1rem;
    -webkit-app-region: drag;
  }

  #example-app-title {
    margin: 0;
    font-size: 1.33rem;
    font-weight: 400;
  }
  ```

- Open the file _theia/theia-customization/src/theia-customization-contribution.ts_
- Replace the content of the file with the following content:

  - Import the _index.css_ file
  - Extend `ApplicationShell`
  - Add a banner on top of the Theia Application Shell:

  ```typescript
  import { ApplicationShell } from "@theia/core/lib/browser";
  import { injectable, postConstruct } from "@theia/core/shared/inversify";

  import "../../src/browser/style/index.css";

  @injectable()
  export class TheiaCustomizationContribution extends ApplicationShell {
    @postConstruct()
    protected init(): void {
      super.init();

      const div = document.createElement("div");
      div.id = "example-header";

      const h1 = document.createElement("h1");
      h1.id = "example-app-title";
      const appTitle = document.createTextNode("My Custom Theia Application");
      h1.append(appTitle);
      div.append(h1);

      document.body.prepend(div);
    }
  }
  ```

- Open the file _theia/theia-customization/src/theia-customization-frontend-module.ts_

  - **Bind** the `TheiaCustomizationContribution` in the `ContainerModule` instance
  - **Rebind** the `ApplicationShell` with the `TheiaCustomizationContribution`  
    in the `ContainerModule` instance

  ```typescript
  import { ContainerModule } from "@theia/core/shared/inversify";
  import { TheiaCustomizationContribution } from "./theia-customization-contribution";
  import { ApplicationShell } from "@theia/core/lib/browser";

  export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TheiaCustomizationContribution).toSelf().inSingletonScope();
    rebind(ApplicationShell)
      .to(TheiaCustomizationContribution)
      .inSingletonScope();
  });
  ```

To make the integration of the new package more convenient in development, we add and modify some scripts in the theia top level _package.json_:

- Open the file _theia/package.json_
- Add a new `script` `build:customization` to trigger the build of the new Theia extension from the top level folder
- Call that script in the build scripts of browser and electron

  ```json
    "scripts": {
      "build:customization": "npm --prefix theia-customization run build",
      "build:browser": "npm run build:customization && npm --prefix browser-app run bundle",
      "build:electron": "npm run build:customization && npm --prefix electron-app run bundle",
      "prepare": "lerna run prepare",
      "postinstall": "theia check:theia-version",
      "start:browser": "npm --prefix browser-app start",
      "start:electron": "npm --prefix electron-app start",
      "watch:browser": "lerna run --parallel watch --ignore electron-app",
      "watch:electron": "lerna run --parallel watch --ignore browser-app"
    },
  ```

- Open a **Terminal**
- Switch to the _theia_ folder
- Run `npm i` to get the dependencies correctly resolved.  
  This also triggers a clean build via the `prepare` script.

If you now start the Theia application, the Theia Application will show a banner on top.

Further information on that topic:

- [Authoring Theia Extensions](https://theia-ide.org/docs/authoring_extensions/)
- [Extending/Adopting the Theia IDE](https://theia-ide.org/docs/blueprint_documentation/)
- [Services and Contributions](https://theia-ide.org/docs/services_and_contributions/)
- [Frontend Application Contributions](https://theia-ide.org/docs/frontend_application_contribution/)
- [Backend Application Contributions](https://theia-ide.org/docs/backend_application_contribution/)

### Remove Default Theia Functionality

The most obvious way to remove a default Theia functionality is of course to remove the Theia package from the `dependencies` of the application project. But sometimes a dependency sneaks in as a transitive dependency, which you can not simply remove. For example `@theia/plugin-ext` has a lot of dependencies to ensure that installed Visual Studio Code extensions work correctly in Theia.

Let's try to remove the Terminal view from the application, which comes in as a transitive dependency of `@theia/plugin-ext` for example.

- Create a new file _theia/theia-customization/src/browser/theia-customization-filter-contribution.ts_

  - Create a new class `TheiaCustomizationFilterContribution` that extends `FilterContribution`
  - Implement the method `registerContributionFilters(registry: ContributionFilterRegistry)` and register a filter that filters out the `TerminalFrontendContribution`

  ```typescript
  import {
    FilterContribution,
    ContributionFilterRegistry,
    Filter,
  } from "@theia/core/lib/common";
  import { injectable } from "@theia/core/shared/inversify";

  @injectable()
  export class TheiaCustomizationFilterContribution
    implements FilterContribution
  {
    registerContributionFilters(registry: ContributionFilterRegistry): void {
      registry.addFilters("*", [
        // Filter out the main outline contribution at:
        // https://github.com/eclipse-theia/theia/blob/master/packages/terminal/src/browser/terminal-frontend-contribution.ts
        filterClassName((name) => name !== "TerminalFrontendContribution"),
      ]);
    }
  }

  function filterClassName(filter: Filter<string>): Filter<Object> {
    return (object) => {
      const className = object?.constructor?.name;
      return className ? filter(className) : false;
    };
  }
  ```

- Create a new file _theia/theia-customization/src/browser/theia-customization-cleanup-contribution.ts_

  - Create a new class `CleanupFrontendContribution` that implements `FrontendApplicationContribution`
  - Implement the lifecycle method `onDidInitializeLayout(app: FrontendApplication)` and dispose any terminal widget  
    This is a way to ensure that a widget that is opened by default somehow is closed before the user sees anything.

  ```typescript
  import { injectable } from "inversify";
  import {
    FrontendApplicationContribution,
    FrontendApplication,
  } from "@theia/core/lib/browser";
  import { MaybePromise } from "@theia/core/lib/common/types";
  import { Widget } from "@theia/core/lib/browser/widgets";

  @injectable()
  export class CleanupFrontendContribution
    implements FrontendApplicationContribution
  {
    /**
     * Called after the application shell has been attached in case there is no previous workbench layout state.
     * Should return a promise if it runs asynchronously.
     */
    onDidInitializeLayout(app: FrontendApplication): MaybePromise<void> {
      // Remove unused widgets
      app.shell.widgets.forEach((widget: Widget) => {
        if (widget.id.startsWith("terminal")) {
          widget.dispose();
        }
      });
    }
  }
  ```

- Open the file _theia/theia-customization/src/theia-customization-frontend-module.ts_

  - **Bind** the `TheiaCustomizationFilterContribution` and the `CleanupFrontendContribution` in the `ContainerModule` instance

  ```typescript
  import { ContainerModule } from "@theia/core/shared/inversify";
  import { TheiaCustomizationContribution } from "./theia-customization-contribution";
  import {
    ApplicationShell,
    FrontendApplicationContribution,
  } from "@theia/core/lib/browser";
  import { TheiaCustomizationFilterContribution } from "./theia-customization-filter-contribution";
  import { bindContribution, FilterContribution } from "@theia/core";
  import { CleanupFrontendContribution } from "./theia-customization-cleanup-contribution";

  export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TheiaCustomizationContribution).toSelf().inSingletonScope();
    rebind(ApplicationShell)
      .to(TheiaCustomizationContribution)
      .inSingletonScope();

    bind(TheiaCustomizationFilterContribution).toSelf().inSingletonScope();
    bindContribution(bind, TheiaCustomizationFilterContribution, [
      FilterContribution,
    ]);

    bind(CleanupFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(
      CleanupFrontendContribution
    );
  });
  ```

If you now build and start the Theia application, the Theia Application should not show any previously opened Terminal views and you should not be able to open a new Terminal.

Further information can be found here:

- [Contribution Filter](https://theia-ide.org/docs/contribution_filter/)

### Color Themes

When you create a custom application you typically want to apply your color theme, e.g. according to your corporate style guide. Visual Studio Code offers a way to generate and publish custom color themes, and Theia adopted the usage of such Visual Studio Code themes.

Create a new color theme:

- In your Visual Studio Code instance, switch to the theme to use a base for our custom color theme
  - Press F1
  - Enter _theme_
  - Select _Preferences: Color Theme_
  - Select for example _Light Modern_
- Modify the theme via settings
  - Press F1
  - Enter _settings_
  - Select _Preferences: Open User Settings (JSON)_
  - Add the property `workbench.colorCustomizations` and some customizations that should be applied, for example the color of the active activity bar icons and the color of the active status bar.
    ```json
    "workbench.colorCustomizations": {
      "statusBar.background": "#da7a08",
      "activityBar.foreground": "#da7a08",
      "activityBar.activeBorder": "#da7a08"
    },
    ```
- Generate a theme file
  - Press F1
  - Enter _theme_
  - Select _Developer: Generate Color Theme from Current Settings_  
    This opens a new editor with the content of the generated color theme.
- Generate a new Visual Studio Code Theme Extension  
  As the Theme Extension could generally be used by multiple Theia applications, and even in Visual Studio Code, we create it on the same folder level as the _theia_ folder.

  - Open a **Terminal**
  - Ensure that you are on the top level of the repository.
  - Create a new project using `generator-code`
    ```
    yo code
    ```
  - Answer the questions of the wizard for example like shown below:

    ```
    ? What type of extension do you want to create? New Color Theme
    ? Do you want to import or convert an existing TextMate color theme? No, start fresh
    ? What's the name of your extension? custom-theme
    ? What's the identifier of your extension? custom-theme
    ? What's the description of your extension?
    ? What's the name of your theme shown to the user? Custom Theme (Light)
    ? Select a base theme: Light
    ? Initialize a git repository? No

    ? Do you want to open the new folder with Visual Studio Code? Skip
    ```

  - Delete the folder _custom-theme/.vscode_
  - Open the file _custom-theme/themes/Custom Theme (Light)-color-theme.json_
    - Copy the content of the previously generated color theme (the _Untitled-1_ file) and replace the content of _custom-theme/themes/Custom Theme (Light)-color-theme.json_ with the copied content.
    - Add the `name` property, which is missing in the generated color theme
      ```json
      {
        "name": "Custom Theme (Light)",
        ...
      }
      ```
  - Pre-install the theme extension to the Theia application

    - Open a **Terminal**
    - Switch to the _custom-theme_ directory
    - Add the following packages as `devDependencies`

      - [`rimraf`](https://www.npmjs.com/package/rimraf) to delete the directory

        ```
        npm i -D rimraf
        ```

      - [`symlink-dir`](https://www.npmjs.com/package/symlink-dir) to create a symbolic link

        ```
        npm i -D symlink-dir
        ```

      - [`mkdirp`](https://www.npmjs.com/package/mkdirp) to create the directory

        ```
        npm i -D mkdirp
        ```

      - [`run-script-os`](https://www.npmjs.com/package/run-script-os) to execute the unzip operation in an OS dependent way

        ```
        npm i -D run-script-os
        ```

    - Open the file _custom-theme/package.json_ and add the following `scripts`

      ```json
      "scripts": {
        "prepare": "npm run clean && npm run symlink",
        "clean": "rimraf ../theia/plugins/custom-theme",
        "symlink": "symlink-dir . ../theia/plugins/custom-theme",
        "package": "vsce package --allow-missing-repository",
        "theia:prepare-app": "npm run package && npm run theia:extract-vsix",
        "theia:extract-vsix": "npm run clean && npm run theia:prepare && npm run unzip",
        "theia:prepare": "mkdirp ../theia/plugins/custom-theme",
        "unzip": "run-script-os",
        "unzip:windows": "tar -xf custom-theme-0.0.1.vsix -C ../theia/plugins/custom-theme",
        "unzip:nix": "unzip custom-theme-0.0.1.vsix -d ../theia/plugins/custom-theme"
      }
      ```

    - Execute the `prepare` script

      ```
      npm run prepare
      ```

    - Verify that the symbolic link to the _custom-theme_ folder is created in _theia/plugins_

      _**Note:**_  
      If you execute `npm run theia:prepare-app` on the commandline of the _custom-theme_ project folder the project is built, packaged to a _.vsix_ file which is then extracted to the _theia/plugins_ folder. This mechanism will be used for the containerization of the Theia Application.

  - Enable the custom theme on startup via predefined preferences
    - Open the file _theia/browser-app/package.json_
    - Add the `theia/frontend/config/preferences` property to set the `workbench.colorTheme`
      ```json
      "theia": {
        "target": "browser",
        "frontend": {
          "config": {
            "applicationName": "My Custom Theia Application",
            "warnOnPotentiallyInsecureHostPattern": false,
            "preferences": {
              "workbench.colorTheme": "Custom Theme (Light)"
            }
          }
        }
      }
      ```
    - Open the file _theia/electron-app/package.json_
    - Add the `theia/frontend/config/preferences` property to set the `workbench.colorTheme`
      ```json
      "theia": {
        "target": "electron",
        "frontend": {
          "config": {
            "applicationName": "My Custom Theia Application",
            "preferences": {
              "workbench.colorTheme": "Custom Theme (Light)"
            }
          }
        }
      }
      ```
  - Build and start the Theia Application and verify that the custom theme is applied on startup

Further information about Visual Studio Code Color Themes can be found here:

- [Color Theme](https://code.visualstudio.com/api/extension-guides/color-theme)
- [Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)

## Containerizing the Theia Browser Application

To containerize the Theia application, you need to setup a Dockerfile with the necessary dependencies.
These are described in [How to build Theia and the example applications](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md).

It is also recommended to setup a multi-stage build, where the first step is the build of the application and the second step is the image creation with only the build result.
This keeps the final image as small as possible.

For this task we need to ensure that the Visual Studio Code Extensions are added to the _plugins_ folder in the extracted _.vsix_ way, as the symbolic links would not work in the Theia Application container if you don't copy the extension projects folders also to the final container image.

- Open the _package.json_ in the repository root

  - Extend the `install:all` script to run `npm install` on the _custom-theme_ project
  - Add a new script `build:all:browser` that calls `theia:prepare-app` for each Visual Studio Code Extension and then builds the Theia Browser Application.

  ```json
  {
    "name": "vscode-theia-cookbook",
    "version": "0.0.0",
    "private": true,
    "scripts": {
      "install:all": "cd vscode-extension && npm install && cd ../angular-extension && npm run install:all && cd ../react-extension && npm run install:all && cd ../custom-theme && npm install && cd ../theia && npm install",
      "build:all:browser": "cd vscode-extension && npm run theia:prepare-app && cd ../angular-extension && npm run theia:prepare-app && cd ../react-extension && npm run theia:prepare-app && cd ../custom-theme && npm run theia:prepare-app && cd ../theia && npm run build:browser"
    }
  }
  ```

- Create a _Dockerfile_ in the repository root

  ```Dockerfile
  # Builder stage
  ARG NODE_VERSION=20
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
  ```

  You can also have a look at the [Theia IDE Browser Dockerfile](https://github.com/eclipse-theia/theia-ide/blob/master/browser.Dockerfile) for an example.

  _**Note:**_  
  The configuration of the `GITHUB_TOKEN` is only necessary if you are hitting the GitHub API rate limit. This could happen because of the `vscode-ripgrep` dependency, which uses the GitHub API to download the native binary part of the library. See [Possible Issues](#possible-issues) for further information.

- Create a _.dockerignore_ file in the repository root to ensure that only the relevant parts for the build are copied to the image.  
  This is especially necessary because of the native artifacts like GLIBC in the local build results, which does not need to be the same on the host and in the resulting container image.

  ```
  **/dist/
  **/build/
  **/node_modules/
  theia/**/lib
  theia/plugins
  theia/**/src-gen/
  theia/electron-app
  **/target/
  yarn.lock
  package-lock.json
  gen-webpack*.*
  **/*.vsix
  ```

- Ensure that you have Docker or Podman installed. In case you are using the Dev Container

  - Open the file _.devcontainer/devcontainer.json_
  - Add the _docker-in-docker_ feature

  ```json
  "features": {
    // https://github.com/devcontainers/features/tree/main/src/docker-in-docker
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  ```

  - Rebuild the Dev Container to get the _docker-in-docker_ feature installed

- Build the container image

  - Open a **Terminal**
  - Execute the following command in the repository root folder

  ```
  docker build -t theia_custom_application .
  ```

If a previous attempt failed and you want to a clean rebuild, use the `--no-cache` option.  
If the console output of the build process does not show the necessary detailed output, use the option `--progress=plain` to get the container output.

- Run the container either via:

  ```
  docker run -d --rm -p 3000:3000 --name theia_custom_application theia_custom_application
  ```

  or if you configured your WSL via `networkingMode=mirrored`

  ```
  docker run -d --rm --network=host --name theia_custom_application theia_custom_application
  ```

- Connect to the running container in case of issues:

  ```
  docker exec -ti theia_custom_application /bin/bash
  ```

### Possible issues

There could be multiple issues in building the container image:

- Build fails with error `Downloading ripgrep failed: Error: API rate limit exceeded`  
  The error is reported in https://github.com/microsoft/vscode/issues/28434. The explained workaround is to create and configure a `GITHUB_TOKEN` environment variable.  
  This can be done via _GitHub - Settings - Developer Settings - Personal access tokens - Tokens (classic) - Generate Token_.
  To avoid that the token is hardcoded in the Dockerfile, configure it as an environment variable.
  To forward an environment variable from the Windows Host to the WSL, you can additionally configure the special environment variable `WSLENV` like this: `WSLENV=GITHUB_TOKEN/u`.
  Have a look at [Share Environment Vars between WSL and Windows](https://devblogs.microsoft.com/commandline/share-environment-vars-between-wsl-and-windows/).
  Once the environment variable is set and available, update the _.devcontainer/devcontainer.json_ file and add the following configuration as described in [Visual Studio Code - Environment variables](https://code.visualstudio.com/remote/advancedcontainers/environment-variables)
  ```json
  "remoteEnv": {
    "GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}"
  },
  ```
  Then run the build using the `--build-arg GITHUB_TOKEN=${GITHUB_TOKEN}` argument:
  ```
  docker build -t theia_custom_application --build-arg GITHUB_TOKEN=${GITHUB_TOKEN} .
  ```

Alternatively you can manually download the native executable for your operating system from [ripgrep-prebuilt/releases](https://github.com/microsoft/ripgrep-prebuilt/releases) and extract it to _theia/node_modules/@vscode/ripgrep/bin_. For the container build, copy the binary in the image creation process to avoid the download at image creation time.

## Conclusion

In this blog post I collected the information I gathered over the last months related to getting started with Eclipse Theia. I hope the information helps others who also want to start with Eclipse Theia. There is of course a lot more to learn about it, so this post is just the beginning.

At this point I want to thank [Stefan Dirix](https://www.linkedin.com/in/stefan-dirix/) and [Philip Langer](https://www.linkedin.com/in/philip-langer/) and the Eclipse Theia Community for the support. Whenever I had questions, opened issues or even contributed something, I got a friendly and helpful response.

The sources of this and the previous blog posts can be found in my [Github repository](https://github.com/fipro78/vscode_theia_cookbook).

I hope you again enjoyed my tutorial and I could share some information via my _"external memory"_.
