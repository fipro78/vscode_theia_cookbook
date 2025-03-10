# Visual Studio Code Extension Webview Getting Started

This tutorial is a _Getting Started_ for developing Visual Studio Code Extensions that contribute a custom editor using a webview. It is intended for developers that are not familiar with Visual Studio Code Extension development and covers the following topics:

- Project setup using a Dev Container
- Developing a custom editor using a webview with Vanilla HTML and Javascript
- Developing a custom editor using a webview with Angular
- Developing a custom editor using a webview with React
- Usage of the VSCode Elements web component library to get an almost native Visual Studio Code look and feel

## Dev Container

When starting a new project, it is recommended to define a _Dev Container_ to

- reduce the time a new developer in the project needs to setup the environment
- encapsulate the development environment for the project

This makes it easy to get a working environment, without having to install all required tools locally.
To make this work you of course need to have at least:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Visual Studio Code Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
- Docker

Working on Windows you can either use [Docker Desktop](https://www.docker.com/products/docker-desktop/), or if you work inside a WSL you can also install Docker in the WSL distribution directly.
Note that on Windows it is recommended to checkout the sources in the WSL and start Visual Studio Code from there.
This improves the performance of the Dev Container, because there is no performance loss caused by disk performance issues when transforming from a Windows file system to a Linux file system in the container.
See [Improve disk performance](https://code.visualstudio.com/remote/advancedcontainers/improve-performance) for further information and alternatives.

_**Note:**_  
A possible WSL setup is described in the [WSL Setup](./wsl_setup.md) tutorial in this repository.

Prepare the project to provide a Dev Container for the development:

- Create a folder _.devcontainer_
- Create a file _devcontainer.json_  
  The simplest form of a _devcontainer.json_ for starting to develop a Visual Studio Code Extension could look like this:

```json
// For format details, see https://aka.ms/devcontainer.json. For config options, see the
// README at: https://github.com/devcontainers/templates/tree/main/src/typescript-node
{
  "name": "Node.js & TypeScript",
  // Or use a Dockerfile or Docker Compose file. More info: https://containers.dev/guide/dockerfile
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "amodio.tsl-problem-matcher",
        "ms-vscode.extension-test-runner"
      ]
    }
  },
  // Features to add to the dev container. More info: https://containers.dev/features.
  // "features": {},
  // Use 'forwardPorts' to make a list of ports inside the container available locally.
  // "forwardPorts": [],
  // Enable to connect the dev container to the host network, needed in case of WSL with networkingMode=mirrored
  // "runArgs": ["--network=host"],
  // Use 'postCreateCommand' to run commands after the container is created.
  "postCreateCommand": "npm install -g npm yo generator-code @vscode/vsce"
  // Uncomment to connect as root instead. More info: https://aka.ms/dev-containers-non-root.
  // "remoteUser": "root"
}
```

The above _devcontainer.json_ uses the predefined Dev Container template for Typescript and Node, adds the recommended extensions and installs a new version of `npm`, the code generator for Visual Studio Code Extensions and the Visual Studio Code Extension Manager used for packaging.

Dependent on the framework you want to use for implementing the webview, you might want to add additional extensions, e.g. the Angular Language Service [angular.ng-template](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).

I also have some Visual Studio Code Extension that I like, for example the [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) and the [Task Explorer](https://marketplace.visualstudio.com/items?itemName=spmeesseman.vscode-taskexplorer).
But of course, the selection of Visual Studio Code Extensions is opinionated, and therefore feel free to add or remove dependent on your project needs.

To further customize the Dev Container, you basically have three options:

- extend the `postCreateCommand` in the _devcontainer.json_  
  This makes sense if you have only few commands to execute, like the installation of the code generator. But it becomes quite uncomfortable when you want to execute several commands.
- use a script file that contains the commands to execute and call that script file in `postCreateCommand`, e.g. like this `"postCreateCommand": "bash ./.devcontainer/postCreateCommand.sh"`  
  This has the advantage that you can call multiple commands in a bash script which is more comfortable than writing it in a single line in JSON.
- use a dedicated _Dockerfile_ that extends the default dev container  
  This makes especially sense if you need to add additional files or need to extend the default dev container in several ways.

Once you are done with creating the Dev Container, open the workspace in the Dev Container:

- Press _F1_ - _Dev Containers: Reopen in Container_

Further information about Visual Studio Code development container:

- [Developing inside a Container](https://code.visualstudio.com/docs/remote/containers)
- [Create a development container](https://code.visualstudio.com/docs/remote/create-dev-container)

## Project Structure

In the following sections we will create Visual Studio Code Extensions that provide a custom editor using the Webview API.
I will guide you through the creation of the projects by using different frameworks.
The reason is to get an idea about how to use different Javascript frameworks for the webview development and to compare the approaches.

The ideas for the following descriptions are based on the [Webview UI Toolkit Sample Extensions](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks) repository.

**_Note:_**  
The Webview UI Toolkit had the intention to provide a component library for building webview-based extensions in Visual Studio Code.
The main idea was to allow the creation of user interfaces that look like the native user interface of Visual Studio Code.

The Webview UI Toolkit itself is deprecated, but the project structures in the examples repository are still interesting.
Basically you create a new Visual Studio Code Extension project, and inside that project you create a subfolder for the webview-ui.

The following implementations will be shown:

- Webview with Vanilla HTML and Javascript
- [Angular Webview Implementation](#angular-webview-implementation)
- [React Webview Implementation](#react-webview-implementation)

Additionally I will show how to use the [VSCode Elements](https://vscode-elements.github.io/) component library for implementing a webview.

_**Note:**_  
If you are only interested in one of the implementations, you can jump directly to the corresponding section.

## Visual Studio Code Extension Project

After the Dev Container is ready, we can start to create the project structure.

As mentioned before, in this tutorial the same editor will be created using different frameworks. But the first steps are always the same:

- Create the Visual Studio Code Extension project
- Implement the Visual Studio Code Extension  
  In our case this means to contribute a custom editor.
- Implement the webview  
  This is specific to the used framework.

### Create the Visual Studio Code Extension project

First create a new Visual Studio Code Extension project:

- Open a **Terminal** and execute the following command

  ```
  yo code
  ```

- Answer the questions of the wizard for example like shown below:

  ```
  # ? What type of extension do you want to create? New Extension (TypeScript)
  # ? What's the name of your extension? vscode-extension
  # ? What's the identifier of your extension? vscode-extension
  # ? What's the description of your extension? LEAVE BLANK
  # ? Initialize a git repository? N
  # ? Which bundler to use? unbundled
  # ? Which package manager to use? npm

  # ? Do you want to open the new folder with Visual Studio Code? Skip
  ```

Further information:

- [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)

A new subfolder _vscode-extension_ will be created that contains the sources of the Visual Studio Code Extension.
We keep the subfolder as we will add further projects in this repository. To make the setup work with the Visual Studio Code Extension in a subfolder, the following modifications are needed:

- In the opened **Terminal** move the _vscode-extension/.vscode_ folder to the root folder. This is necessary so the Visual Studio Code settings are resolved from the project root and not a subfolder.

  ```console
  mv vscode-extension/.vscode .
  ```

- Edit the _.vscode/launch.json_ and add the project folder to the `extensionDevelopmentPath` and the `outFiles`

  ```json
  "args": [
  	"--extensionDevelopmentPath=${workspaceFolder}/vscode-extension"
  ],
  "outFiles": [
  	"${workspaceFolder}/vscode-extension/out/**/*.js"
  ],
  ```

- Edit the _.vscode/tasks.json_ and change the working directory the existing task to the project directory

  ```json
  "options": {
    "cwd": "${workspaceFolder}/vscode-extension"
  }
  ```

To verify that the setup works, open the file _vscode-extension/src/extension.ts_ and press F5 to start a new Visual Studio Code instance with the extension, open the **Command Palette** (CTRL + SHIFT + P) and search for _Hello_ to run the command.

- Create a _.gitignore_ in the repository root  
  As we did not initialize a git repository by the code generator, there is no _.gitignore_. We therefore need to create one ourselves to ensure that not too much will be added to the repository.

```
# Compiled output
dist
out
tmp
out-tsc

# Node
node_modules

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*
*.vsix
```

### Implement the Visual Studio Code Extension

Instead of showing a message or opening a simple example view, we will create a custom editor.

- Open the _vscode-extension/package.json_

  - Replace the `contributes` section with the following snippet:

  ```json
  "contributes": {
    "customEditors": [
      {
        "viewType": "vscode-extension.personEditor",
        "displayName": "Visual Studio Code Person Editor",
        "selector": [
          {
            "filenamePattern": "*.person"
          }
        ],
        "priority": "default"
      }
    ]
  },
  ```

- Create a new file _vscode-extension/src/personEditor.ts_

  - Implement `vscode.CustomTextEditorProvider`

  ```typescript
  import * as vscode from "vscode";

  export class PersonEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = "vscode-extension.personEditor";

    constructor(private readonly context: vscode.ExtensionContext) {}
  }
  ```

  - Add the following `register()` method that is used to register the provider via `vscode.window.registerCustomEditorProvider()`

  ```typescript
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PersonEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      PersonEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }
  ```

  - Implement `resolveCustomTextEditor()` that uses a webview

  ```typescript
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      // Enable scripts in the webview
      enableScripts: true,
    };

    webviewPanel.webview.html = this.getWebviewHtml(webviewPanel.webview);

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          this.updateWebview(webviewPanel, document);
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    this.updateWebview(webviewPanel, document);
  }
  ```

  - Implement the bidirectional messaging between webview and editor

    - Add the following code in `resolveCustomTextEditor()`

    ```typescript
    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "updateDocument":
          this.updateDocument(document, e.text);
          return;
      }
    });
    ```

    - Add the following methods to the `PersonEditorProvider`

    ```typescript
    /**
     * Updates the webview with the content of the current document.
     * @param webviewPanel The webview panel to post the message to.
     * @param document The current document.
     */
    private updateWebview(
      webviewPanel: vscode.WebviewPanel,
      document: vscode.TextDocument
    ) {
      // Post message with text of the document to the webview
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
    }

    /**
     * Applies a set of text edits to a document.
     * @param document The current document.
     * @param text The text to set to the document.
     * @returns A thenable that resolves when the edit could be applied.
     */
    private updateDocument(document: vscode.TextDocument, text: string) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        text
      );
      return vscode.workspace.applyEdit(edit);
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getWebviewHtml(webview: vscode.Webview): string {
      // TODO implement
      return "";
    }
    ```

- Change _vscode-extension/src/extension.ts_

  - Replace the existing example code with the following snippet

  ```typescript
  // The module 'vscode' contains the Visual Studio Code extensibility API
  // Import the module and reference it with the alias vscode in your code below
  import * as vscode from "vscode";
  import { PersonEditorProvider } from "./personEditor";

  // This method is called when your extension is activated
  export function activate(context: vscode.ExtensionContext) {
    // Register our custom editor provider
    context.subscriptions.push(PersonEditorProvider.register(context));
  }

  // This method is called when your extension is deactivated
  export function deactivate() {}
  ```

### Implement the webview

_**Note:**_  
The following code is inspired and adapted from [Custom Editor API Samples](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample).

- Open the file _vscode-extension/src/personEditor.ts_
  - Replace the `getWebviewHtml()` method that was added before
  - Add the `getNonce()` method to `PersonEditorProvider`

```typescript
/**
 * Get the static html used for the editor webviews.
 */
private getWebviewHtml(webview: vscode.Webview): string {
  // Local path to script and css for the webview
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css")
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
  );

  const nonce = this.getNonce();

  // Tip: Install the es6-string-html Visual Studio Code extension to enable code highlighting below
  return /* html */ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">

      <!--
      Use a content security policy to only allow loading images, styles and fonts from https or from our extension directory,
      and only allow scripts that have a specific nonce.
      -->
      <meta
        http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${webview.cspSource}; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <link href="${stylesUri}" rel="stylesheet" />

      <title>Person Editor</title>
  </head>
  <body>
      <h1>Visual Studio Code Person Editor</h1>
      <div class="person">
        <div class="row">
          <label for="firstname">Firstname:</label>
          <div class="value">
            <input type="text" id="firstname"/>
          </div>
        </div>
        <div class="row">
          <label for="lastname">Lastname:</label>
          <div class="value">
            <input type="text" id="lastname"/>
          </div>
        </div>
      </div>

      <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
  </html>`;
}

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

- Create the folder _vscode-extension/media_
- Create the file _vscode-extension/media/main.js_ with the following content

```javascript
// Script run within the webview itself.
(function () {
  // Get a reference to the Visual Studio Code webview api.
  // We use this API to post messages back to our extension.

  const vscode = acquireVsCodeApi();

  const personContainer = /** @type {HTMLElement} */ (
    document.querySelector(".person")
  );

  const errorContainer = document.createElement("div");
  document.body.appendChild(errorContainer);
  errorContainer.className = "error";
  errorContainer.style.display = "none";

  /**
   * Render the document in the webview.
   */
  function updateContent(/** @type {string} */ text) {
    let json;
    try {
      if (!text) {
        text = "{}";
      }
      json = JSON.parse(text);
    } catch {
      personContainer.style.display = "none";
      errorContainer.innerText = "Error: Document is not valid json";
      errorContainer.style.display = "";
      return;
    }
    personContainer.style.display = "";
    errorContainer.style.display = "none";

    const firstname = document.getElementById("firstname");
    const lastname = document.getElementById("lastname");

    if (json.firstname) {
      firstname.value = json.firstname;
    }
    if (json.lastname) {
      lastname.value = json.lastname;
    }

    firstname.oninput = () => {
      json.firstname = firstname.value;
      vscode.postMessage({
        type: "updateDocument",
        text: JSON.stringify(json, null, 2),
      });
    };

    lastname.oninput = () => {
      json.lastname = lastname.value;
      vscode.postMessage({
        type: "updateDocument",
        text: JSON.stringify(json, null, 2),
      });
    };
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const text = message.text;

        // Update our webview's content
        updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });

        return;
    }
  });

  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads
  const state = vscode.getState();
  if (state) {
    updateContent(state.text);
  }
})();
```

- Create the file _vscode-extension/media/styles.css_ with the following content

```css
label {
  font-weight: 600;
  display: block;
}
```

If everything is correctly in place, you can verify the editor by

- pressing F5 to start a new Visual Studio Code instance with the extension
- opening a folder somewhere  
  Create a folder _example_ in the home directory of the _node_ user in the Dev Container for example.
- creating a new file named _homer.person_

Now a webview with two input fields should be visible.

- enter values for _Firstname_ and _Lastname_
- Save via _CTRL + S_
- Right click on the created file in the _Explorer_
- Select _Open With..._ - _Text Editor_

The default text editor should open with the JSON content of the created file.

Further information about the used API and official examples:

- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Webview API Sample](https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample)
- [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Custom Editor API Samples](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample)

### Install scripts

When new developers in the project check out the repository and open it in a Dev Container, they first need to run the `npm` commands to install the project dependencies.
This can be also automated via scripts and a Dev Container configuration.

- Create a _package.json_ in the repository root

```json
{
  "name": "vscode-theia-cookbook",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "install:all": "cd vscode-extension && npm install"
  }
}
```

- Execute the script on `postCreateCommand`

  - If you use the `postCreateCommand` directly, open _.devcontainer/devcontainer.json_ and update the instruction

    ```json
    "postCreateCommand": "npm install -g npm yo generator-code @vscode/vsce; npm run install:all"
    ```

  - If you use a init shell script, add the following instruction at the end of the script file

    ```bash
    npm run install:all
    ```

If you now rebuild the Dev Container, you will notice that at the npm install scripts are automatically executed.

### VSCode Elements Lite

You might have noticed that the input fields in the webview do not look like the input fields in Visual Studio Code, e.g. in the _Settings_.
To achieve this, we would need to spend quite some time in the definition of the CSS. And of course we need to use the various CSS variables defined in Visual Studio Code.

To avoid this effort, we can also use the [VSCode Elements](https://vscode-elements.github.io/) component library, or in case of vanilla HTML and CSS, [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/).

As a first step, we will only use the styling variant by using [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/).

Add `@vscode-elements/elements-lite` as a dependency in the _package.json_ and reference the CSS files in the webview HTML.

- Open a **Terminal**
- Switch to the _vscode-extension_ folder
- Install `@vscode-elements/elements-lite` as a `dependency`

  ```
  npm install @vscode-elements/elements-lite
  ```

- Open the file _vscode-extension/src/personEditor.ts_

  - Resolve the URIs to the VSCode Elements Lite CSS files
  - Add the references to the CSS files in the `<head>` section of the HTML content
  - Add `class="vscode-label"` to the `label` tags, and `class="vscode-textfield"` to the `input` fields

    ```typescript
    /**
     * Get the static html used for the editor webviews.
     */
    private getWebviewHtml(webview: vscode.Webview): string {
      // Local path to script and css for the webview
      const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css")
      );
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
      );

      const labelUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "node_modules",
          "@vscode-elements/elements-lite",
          "components",
          "label",
          "label.css"
        )
      );

      const textfieldUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "node_modules",
          "@vscode-elements/elements-lite",
          "components",
          "textfield",
          "textfield.css"
        )
      );

      const nonce = this.getNonce();

      // Tip: Install the es6-string-html Visual Studio Code extension to enable code highlighting below
      return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">

          <!--
          Use a content security policy to only allow loading images, styles and fonts from https or from our extension directory,
          and only allow scripts that have a specific nonce.
          -->
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src ${webview.cspSource}; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <link href="${stylesUri}" rel="stylesheet" />
          <link href="${labelUri}" rel="stylesheet" />
          <link href="${textfieldUri}" rel="stylesheet" />

          <title>Person Editor</title>
      </head>
      <body>
          <h1>Visual Studio Code Person Editor</h1>
        <div class="person">
          <div class="row">
            <label for="firstname" class="vscode-label">Firstname:</label>
            <div class="value">
              <input type="text" id="firstname" class="vscode-textfield"/>
            </div>
          </div>
          <div class="row">
            <label for="lastname" class="vscode-label">Lastname:</label>
            <div class="value">
              <input type="text" id="lastname" class="vscode-textfield"/>
            </div>
          </div>
        </div>

          <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
    }
    ```

If you now restart the application, the input fields in the webview of the custom editor will look like native Visual Studio Code components.

### VSCode Elements

If you like to use the Javascript enabled web components, you can use the [VSCode Elements](https://vscode-elements.github.io/) component library.

Add `@vscode-elements/elements` as a dependency in the _package.json_ and reference the CSS files in the webview HTML.

- Open a **Terminal**
- Switch to the _vscode-extension_ folder
- Install `@vscode-elements/elements` as a `dependency`

  ```
  npm install @vscode-elements/elements
  ```

- Open the file _vscode-extension/src/personEditor.ts_

  - Resolve the URI to the VSCode Elements bundled version Javascript file
  - Add the reference to the Javascript file in the `<body>` section of the HTML content and use the attribute `type="module"`
  - Replace the `label` tag with `vscode-label`, and the `input` tag with `vscode-textfield`

    ```typescript
    /**
     * Get the static html used for the editor webviews.
     */
    private getWebviewHtml(webview: vscode.Webview): string {
      // Local path to script and css for the webview
      const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css")
      );
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
      );

      const elementsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "node_modules",
          "@vscode-elements/elements",
          "dist",
          "bundled.js"
        )
      );

      const nonce = this.getNonce();

      // Tip: Install the es6-string-html Visual Studio Code extension to enable code highlighting below
      return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">

          <!--
          Use a content security policy to only allow loading images, styles and fonts from https or from our extension directory,
          and only allow scripts that have a specific nonce.
          -->
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src ${webview.cspSource}; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <link href="${stylesUri}" rel="stylesheet" />

          <title>Person Editor</title>
      </head>
      <body>
          <h1>Visual Studio Code Person Editor</h1>
          <div class="person">
            <div class="row">
              <vscode-label for="firstname">Firstname:</vscode-label>
              <div class="value">
                <vscode-textfield type="text" id="firstname"/>
              </div>
            </div>
            <div class="row">
              <vscode-label for="lastname">Lastname:</vscode-label>
              <div class="value">
                <vscode-textfield type="text" id="lastname"/>
              </div>
            </div>
          </div>

          <script nonce="${nonce}" src="${scriptUri}"></script>
          <script nonce="${nonce}" src="${elementsUri}" type="module"></script>
      </body>
      </html>`;
    }
    ```

If you now restart the application, the input fields in the webview of the custom editor will look and behave like native Visual Studio Code components.

## Angular Webview Implementation

The above steps showed how to create a basic Visual Studio Code Extension with vanilla HTML, Javascript and CSS.
If the user interface is more complicated than two simple input fields, this can become quite complicated.
In such a case it can be interesting to use a Javascript framework for the implementation of the webview.

In the following chapter we create an Angular project that serves as the webview frontend of the Visual Studio Code Extension.

_**Note:**_  
The following description is based on the [vscode-webview-ui-toolkit-samples Hello World (Angular) example](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-angular). I reused several parts of the sample code and adapted it where necessary.  
Also note that I am not an expert in developing Angular applications. So probably the following sample can be more efficient, but the goal is to help getting started in setting up a Visual Studio Code Extension with Angular webview.

- Add the Angular related extensions and configurations to the Dev Container

  - Edit the _.devcontainer/devcontainer.json_ and add the `angular.ng-template` to the `customizations/vscode/extensions`
  - Edit the `npm install -g` command to additionally install `@angular/cli`  
    Dependent on your setup, this is either in the `postCreateCommand` of the _devcontainer.json_ or in the _postCreateCommand.sh_ script file.
  - Optional:  
    In case you use the _postCreateCommand.sh_ script file, you can also add the following two instructions to load the Angular CLI autocompletion by default

    ```
    echo '# Load Angular CLI autocompletion.' >> ~/.bashrc
    echo 'source <(ng completion script)' >> ~/.bashrc
    ```

  - Edit the _.vscode/extension.json_ and add the `angular.ng-template` to the `recommendations`
  - Rebuild the Dev Container  
    Press F1 - _Dev Containers: Rebuild Container_

- Create a new Visual Studio Code Extension project.

  - Open a **Terminal** and execute the following command

    ```
    yo code
    ```

  - Answer the questions of the wizard for example like shown below:

    ```
    # ? What type of extension do you want to create? New Extension (TypeScript)
    # ? What's the name of your extension? angular-extension
    # ? What's the identifier of your extension? angular-extension
    # ? What's the description of your extension? LEAVE BLANK
    # ? Initialize a git repository? N
    # ? Which bundler to use? unbundled
    # ? Which package manager to use? npm

    # ? Do you want to open the new folder with Visual Studio Code? Skip
    ```

- Delete the created _angular-extension/.vscode_ folder
  ```
  rm -rf angular-extension/.vscode
  ```
- Open the _.vscode/launch.json_

  - Add the `extensionDevelopmentPath` to the newly created _angular-extension_ to the `args` get both extensions started on launch
  - Add the path to the build result directory of the newly created _angular-extension_ to the `outFiles`

    ```json
    {
      "version": "0.2.0",
      "configurations": [
        {
          "name": "Run Extension",
          "type": "extensionHost",
          "request": "launch",
          "args": [
            "--extensionDevelopmentPath=${workspaceFolder}/vscode-extension",
            "--extensionDevelopmentPath=${workspaceFolder}/angular-extension"
          ],
          "outFiles": [
            "${workspaceFolder}/vscode-extension/out/**/*.js",
            "${workspaceFolder}/angular-extension/out/**/*.js"
          ],
          "preLaunchTask": "${defaultBuildTask}"
        }
      ]
    }
    ```

- Create a new ng application as described in [Create a workspace and initial application](https://angular.dev/tools/cli/setup-local#create-a-workspace-and-initial-application).  
  It is created inside the Visual Studio Code Extension project folder, as it serves as the implementation of the webview.

  - Open a **Terminal**
  - Switch to the _angular-extension_ folder
  - Execute the following command to create the ng application

    ```
    ng new webview-ui
    ```

  - Answer the questions of the wizard for example like shown below:

    ```console
    # ? Would you like to share pseudonymous usage data ... N
    # ? Which stylesheet format would you like to use? CSS
    # ? Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? N
    ```

This command creates a new Angular project in the folder _angular-extension/webview-ui_ with Static Site Generation.

Of course this creates much more than we need for our setup. Therefore we need to cleanup as a next step.

- If no git repository is initialized already, it will be done automatically for the _webview-ui_ folder. In that case delete the generated _.git_ folder.

  ```
  rm -rf webview-ui/.git
  ```

- Transfer the generated content in _angular-extension/webview-ui/.vscode_ to the files in _.vscode_.

  - _launch.json_  
    Copy the two configurations to _.vscode/launch.json_ and add the `webRoot` setting

    ```json
    {
      "name": "ng serve",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "npm: start",
      "url": "http://localhost:4200/",
      "webRoot": "${workspaceFolder}/angular-extension/webview-ui"
    },
    {
      "name": "ng test",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "npm: test",
      "url": "http://localhost:9876/debug.html",
      "webRoot": "${workspaceFolder}/angular-extension/webview-ui"
    }
    ```

  - _tasks.json_  
    Copy the two configurations to _.vscode/tasks.json_ and add the `cwd` option

    ```json
    {
      "type": "npm",
      "script": "start",
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
            "regexp": "bundle generation complete"
          }
        }
      },
      "options": {
        "cwd": "${workspaceFolder}/angular-extension/webview-ui"
      }
    },
    {
      "type": "npm",
      "script": "test",
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
            "regexp": "bundle generation complete"
          }
        }
      },
      "options": {
        "cwd": "${workspaceFolder}/angular-extension/webview-ui"
      }
    }
    ```

  - After the configurations are transfered, the generated _.vscode_ folder can be deleted from the _webview-ui_ folder

    ```
    rm -rf webview-ui/.vscode
    ```

  - Update the _angular-extension/webview-ui/package.json_
    - Change the `name` to `angular-webview-ui`

  To verify that the setup works, you can now either run the task via

- Press _F1_ - _Tasks: Run Task_ - _npm:start_
- Run the launch configuration
  - Open _Run and Debug_
  - Select _ng serve_ in the dropdown
  - Click _Start Debugging_ or press _F5_

This will start the ng application and host it via http://localhost:4200.

## Prepare the NG Application as webview

In the next steps the two projects need to be configured so the NG application can be used as webview in the Visual Studio Code Extension.

- Update _angular-extension/tsconfig.json_
  - Change the `outDir` to `./dist`  
    This might not be really necessary, but having a good naming convention for the folders helps in understanding the structure. The `dist` folder will contain the content that gets distributed in the packaged Visual Studio Code Extension.
  - Add `DOM` to the `lib` configuration
  - Configure `exclude` to avoid `node_modules` and `webview-ui` being included in the codebase
  ```json
  {
    "compilerOptions": {
      "module": "Node16",
      "target": "ES2022",
      "outDir": "./dist",
      "lib": ["ES2022", "DOM"],
      "sourceMap": true,
      "rootDir": "src",
      "strict": true
    },
    "exclude": ["node_modules", "webview-ui"]
  }
  ```
- Update _angular-extension/package.json_
  - Change `main` to point to `./dist/extension.js`
- Update _.vscode/launch.json_
  - Correct the `outFiles` value to `"${workspaceFolder}/angular-extension/dist/**/*.js"`
- Update _angular-extension/.vscodeignore_ to ignore all _webview-ui_ files except the build directory

  ```
  # Ignore extension configs
  .vscode/**

  # Ignore test files
  .vscode-test/**
  **/.vscode-test.*
  dist/test/**

  # Ignore source code
  src/**

  # Ignore all webview-ui files except the build directory
  node_modules/**
  webview-ui/**
  !webview-ui/build/**

  # Ignore Misc
  .yarnrc
  vsc-extension-quickstart.md
  **/.gitignore
  **/tsconfig.json
  **/vite.config.ts
  **/.eslintrc.json
  **/*.map
  **/*.ts
  ```

- Update _angular-extension/webview-ui/tsconfig.json_
  - Add the following configurations in the `compilerOptions`
    ```json
    "baseUrl": "./",
    "lib": ["ES2022", "dom"],
    "sourceMap": true,
    "declaration": false
    ```
- Update _angular-extension/webview-ui/angular.json_
  - Set the `schematics` to the following
    ```json
    "schematics": {
      "@schematics/angular:application": {
        "strict": true
      }
    },
    ```
  - Change the `builder` from `application` to `browser-esbuild`
    ```json
    "builder": "@angular-devkit/build-angular:browser-esbuild",
    "options": {
      "outputPath": "build",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": ["zone.js"],
      "tsConfig": "tsconfig.app.json",
      "assets": [
        {
          "glob": "**/*",
          "input": "public"
        }
      ],
      "styles": ["src/styles.css"],
      "scripts": []
    },
    ```
  - Ensure that the `outputHashing` is set to `none` for the `production` and the `development` configuration, otherwise resources can not be referenced in the webview correctly.
    ```json
    "outputHashing": "none"
    ```
- Update _angular-extension/webview-ui/.gitignore_
  - Add the _/build_ folder
- After we changed the output folder to _dist_ you can delete the folder _angular-extension/out_ if it was already created.

- Remove the `RouterOutlet`  
  This is necessary to make the usage of assets from third-party modules that are transfered to the _media_ folder work correctly.

  - Update _angular-extension/webview-ui/src/app/app.component.html_
    - Remove `<router-outlet />` usage (bottom of the file)
  - Update _angular-extension/webview-ui/src/app/app.component.ts_
    - Remove the `RouterOutlet` import
  - Update _angular-extension/webview-ui/src/app/app.config.ts_

    - Remove the router configuration

      ```typescript
      import {
        ApplicationConfig,
        provideZoneChangeDetection,
      } from "@angular/core";

      export const appConfig: ApplicationConfig = {
        providers: [provideZoneChangeDetection({ eventCoalescing: true })],
      };
      ```

  - Delete _angular-extension/webview-ui/src/app/app.routes.ts_

- Test if the build succeeds
  - Open a **Terminal**
  - Switch to the _angular-extension/webview-ui_ folder
  - Call `ng build`  
    This should create the folder _angular-extension/webview-ui/build_
  - Switch to the _angular-extension_ folder
  - Call `npm run compile`  
    This should create the folder _angular-extension/dist_.

## Use the NG Application as webview

The next step is to use the NG Application as a Visual Studio Code Extension WebView.
For this we need to perform the same steps as described previously in [Implement the Visual Studio Code Extension](#implement-the-visual-studio-code-extension).

- Open the _angular-extension/package.json_

  - Replace the `contributes` section with the following snippet:

    ```json
    "contributes": {
      "customEditors": [
        {
          "viewType": "angular-extension.personEditor",
          "displayName": "Angular Person Editor",
          "selector": [
            {
              "filenamePattern": "*.person"
            }
          ]
        }
      ]
    },
    ```

- Create a new file _angular-extension/src/personEditor.ts_

  - Copy the content from _vscode-extension/src/personEditor.ts_  
    _**Note:**_  
    If you have not created that file in the previous vanilla HTML, CSS, Javascript part, follow the steps in [Implement the Visual Studio Code Extension](#implement-the-visual-studio-code-extension) to create the content of the file.
  - Change the value of `viewType` to `angular-extension.personEditor`

    ```typescript
    private static readonly viewType = "angular-extension.personEditor";
    ```

  - Optional:  
    Extend the `webview.options` to restrict the webview to only load resources from _dist_ and _webview-ui/build_ directories

    ```typescript
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      // Enable scripts in the webview
      enableScripts: true,

      // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "webview-ui/build"),
      ],
    };
    ```

  - Change the implementation of `getWebviewHtml()` so that it basically returns the same HTML as in _angular-extension/webview-ui/src/index.html_. But instead of relative URLs to resources like CSS and the Javascript files, special WebView URIs are used. This is necessary so the resources can be correctly resolved inside a webview, which is described in [Loading local content](https://code.visualstudio.com/api/extension-guides/webview#loading-local-content).

    ```typescript
    /**
     * Get the static html used for the editor webviews.
     */
    private getWebviewHtml(webview: vscode.Webview): string {
      // The CSS file from the Angular build output
      const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "webview-ui",
          "build",
          "styles.css"
        )
      );
      // The JS files from the Angular build output
      const polyfillsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "webview-ui",
          "build",
          "polyfills.js"
        )
      );
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "webview-ui",
          "build",
          "main.js"
        )
      );

      const nonce = this.getNonce();

      // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
      return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta
                  http-equiv="Content-Security-Policy"
                  content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
              <link rel="stylesheet" type="text/css" href="${stylesUri}">
              <title>Person Editor</title>
          </head>
          <body>
              <app-root></app-root>
              <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
              <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
          </body>
          </html>
        `;
    }
    ```

- Change the content of _angular-extension/src/extension.ts_

  - Replace the content with the following code

    ```typescript
    // The module 'vscode' contains the Visual Studio Code extensibility API
    // Import the module and reference it with the alias vscode in your code below
    import * as vscode from "vscode";
    import { PersonEditorProvider } from "./personEditor";

    // This method is called when your extension is activated
    export function activate(context: vscode.ExtensionContext) {
      // Register our custom editor provider
      context.subscriptions.push(PersonEditorProvider.register(context));
    }

    // This method is called when your extension is deactivated
    export function deactivate() {}
    ```

## Script Updates

We now have a NG application project inside a Visual Studio Code Extension project. The build and run scripts are not automatically connected. For example, if you change code in the NG application and then launch the Visual Studio Code Extension, the changes are not automatically reflected. This is because the Visual Studio Code Extension is using the build results of the NG Application, and not the sources.

To connect the two projects, we need to update the `scripts` section in _angular-extension/package.json_

_**Note:**_  
The `watch` script needs to execute the watch operations in parallel and not sequentially.
While one solution to this could be the usage of `&` instead of `&&` on a Unix system, a better and OS independent solution is the usage of [`concurrently`](https://www.npmjs.com/package/concurrently).

- Add `concurrently` as a `devDependency` to the _angular-extension/package.json_
  - Open a **Terminal**
  - Switch to the _angular-extension_ folder
  - Execute the following command
    ```
    npm i -D concurrently
    ```
- Open _angular-extension/package.json_
  - Add `scripts` for the _webview-ui_
    ```json
    "start:webview": "npm --prefix webview-ui run start",
    "build:webview": "npm --prefix webview-ui run build",
    "watch:webview": "npm --prefix webview-ui run watch",
    ```
  - Update `vscode:prepublish` to call the `build:webview` script additionally
    ```json
    "vscode:prepublish": "npm run build:webview && npm run compile",
    ```
  - Update the `watch` script to call also `watch:webview` by using `concurrently`
    ```json
    "watch": "concurrently --kill-others \"npm run watch:webview\" \"tsc -watch -p ./\"",
    ```

To make the updated `watch` script also work when launching the extension, the corresponding task in _.vscode/tasks.json_ needs to be updated.

If you only want to watch the _angular-extension_, update the configuration like this (notice the `endsPattern`). Replace the `npm:watch` script at the top of the _tasks.json_.

```json
{
  "type": "npm",
  "script": "watch",
  "problemMatcher": {
    "base": "$tsc-watch",
    "background": {
      "activeOnStart": true,
      "beginsPattern": {
        "regexp": "(.*?)"
      },
      "endsPattern": {
        "regexp": "bundle generation complete"
      }
    }
  },
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "options": {
    "cwd": "${workspaceFolder}/angular-extension"
  }
},
```

If you want to watch the _vscode-extension_ and the _angular-extension_ at the same time, update the configuration like this:

```json
{
  "label": "Watch Extensions",
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "dependsOn": ["VS Code Extension Watch", "Angular Extension Watch"]
},
{
  "label": "VS Code Extension Watch",
  "type": "shell",
  "command": "npm run watch",
  "problemMatcher": "$tsc-watch",
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build"
  },
  "options": {
    "cwd": "${workspaceFolder}/vscode-extension"
  }
},
{
  "label": "Angular Extension Watch",
  "type": "shell",
  "command": "npm run watch",
  "problemMatcher": {
    "base": "$tsc-watch",
    "background": {
      "activeOnStart": true,
      "beginsPattern": {
        "regexp": "(.*?)"
      },
      "endsPattern": {
        "regexp": "bundle generation complete"
      }
    }
  },
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build"
  },
  "options": {
    "cwd": "${workspaceFolder}/angular-extension"
  }
},
```

The above snippet defines a _Compound Task_, makes it the default task that should be executed via _launch.json_ `preLaunchTask` configuration and changes the task types from `npm` to `shell`.
This change is necessary because otherwise there is a name collision in the _Task auto-detection_.

To verify that it works

- Launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _Angular Person Editor_

This should open the webview with the content of the Angular application.

- In the Visual Studio Code instance that is used for development, open the file _angular-extension/webview-ui/src/app/app.component.html_
- Search for the string `Congratulations`, change the sentence, e.g. by adding `May the force by with you`, and save the changes
- Switch to the Visual Studio Code instance launched for testing the extension
  - Either close and reopen the webview
  - Reload the webview by pressing F1 - _Developer: Reload Webviews_

You should now see the applied changes.

- In the Visual Studio Code instance that is used for development, open the file _angular-extension/src/personEditor.ts_
- Change for example the webview HTML by adding `<p>Hello World</p>` in the `<body>`.
- Switch to the Visual Studio Code instance launched for testing the extension
- Reload the **Extension Development Host** so that it picks up the changes. You have two options to do this:
  - Click on the debug restart action
  - Press `Ctrl + R` / `Cmd + R` in the **Extension Development Host** window

You should see the applied changes now. If not reopen the webview and verify that the applied changes are visible.

_**Note:**_  
Don't forget to remove the modification to the webview HTML, so it does not affect the next steps.

### Angular Editor Implementation

The next step is to implement a custom editor, just like in the vanilla HTML, CSS, Javascript example before.
It uses the same principles with regards to communication between extension and webview, and looks quite the same.
But of course we use Angular for the UI implementation, in this case [Reactive forms](https://angular.dev/guide/forms/reactive-forms) for the implementation.

- Add `@types/vscode-webview` as a `devDependency` to the _angular-extension/webview-ui_ project
  - Open a **Terminal**
  - Switch to the folder _angular-extension/webview-ui_
  - Run the following command
    ```
    npm i -D @types/vscode-webview
    ```
- Create a new folder _angular-extension/webview-ui/src/app/utilities_
- Create a new file _vscode.ts_ in the new folder

  - Add the following code, which is a copy of [vscode-webview-ui-toolkit-samples](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/frameworks/hello-world-angular/webview-ui/src/app/utilities/vscode.ts)

    ```typescript
    import type { WebviewApi } from "vscode-webview";

    /**
     * A utility wrapper around the acquireVsCodeApi() function, which enables
     * message passing and state management between the webview and extension
     * contexts.
     *
     * This utility also enables webview code to be run in a web browser-based
     * dev server by using native web browser features that mock the functionality
     * enabled by acquireVsCodeApi.
     */
    class VSCodeAPIWrapper {
      private readonly vsCodeApi: WebviewApi<unknown> | undefined;

      constructor() {
        // Check if the acquireVsCodeApi function exists in the current development
        // context (i.e. VS Code development window or web browser)
        if (typeof acquireVsCodeApi === "function") {
          this.vsCodeApi = acquireVsCodeApi();
        }
      }

      /**
       * Post a message (i.e. send arbitrary data) to the owner of the webview.
       *
       * @remarks When running webview code inside a web browser, postMessage will instead
       * log the given message to the console.
       *
       * @param message Abitrary data (must be JSON serializable) to send to the extension context.
       */
      public postMessage(message: unknown) {
        if (this.vsCodeApi) {
          this.vsCodeApi.postMessage(message);
        } else {
          console.log(message);
        }
      }

      /**
       * Get the persistent state stored for this webview.
       *
       * @remarks When running webview source code inside a web browser, getState will retrieve state
       * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
       *
       * @return The current state or `undefined` if no state has been set.
       */
      public getState(): unknown | undefined {
        if (this.vsCodeApi) {
          return this.vsCodeApi.getState();
        } else {
          const state = localStorage.getItem("vscodeState");
          return state ? JSON.parse(state) : undefined;
        }
      }

      /**
       * Set the persistent state stored for this webview.
       *
       * @remarks When running webview source code inside a web browser, setState will set the given
       * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
       *
       * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
       * using {@link getState}.
       *
       * @return The new state.
       */
      public setState<T extends unknown | undefined>(newState: T): T {
        if (this.vsCodeApi) {
          return this.vsCodeApi.setState(newState);
        } else {
          localStorage.setItem("vscodeState", JSON.stringify(newState));
          return newState;
        }
      }
    }

    // Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
    export const vscode = new VSCodeAPIWrapper();
    ```

  - The `VSCodeAPIWrapper` is used for
    - Aquiring the VSCode API
    - Managing the persistent state of the webview
    - Posting messages from the webview to the extension

- Update _angular-extension/webview-ui/src/app/app.component.ts_ by replacing the content with the following code

  ```typescript
  import { Component, HostListener } from "@angular/core";
  import { FormControl, ReactiveFormsModule } from "@angular/forms";
  import { vscode } from "./utilities/vscode";

  @Component({
    selector: "app-root",
    imports: [ReactiveFormsModule],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.css",
  })
  export class AppComponent {
    firstname = new FormControl("");
    lastname = new FormControl("");
    personObject: any;

    constructor() {
      // Webviews are normally torn down when not visible and re-created when they become visible again.
      // State lets us save information across these re-loads
      const state = vscode.getState() as any;
      if (state) {
        this.updateContent(state.text);
      }
    }

    // Handle messages sent from the extension to the webview
    @HostListener("window:message", ["$event"])
    handleMessage(event: MessageEvent) {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case "update":
          const text = message.text;

          // Update our webview's content
          this.updateContent(text);

          // Then persist state information.
          // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
          vscode.setState({ text });
          return;
      }
    }

    /**
     * Update the data shown in the document in the webview.
     */
    updateContent(text: string) {
      if (text !== "") {
        this.personObject = JSON.parse(text);
        this.firstname.setValue(this.personObject.firstname);
        this.lastname.setValue(this.personObject.lastname);
      }
    }

    /**
     * Update the document in the extension.
     */
    updateDocument() {
      this.personObject = {
        firstname: this.firstname.value,
        lastname: this.lastname.value,
      };

      vscode.postMessage({
        type: "updateDocument",
        text: JSON.stringify(this.personObject, null, 2),
      });
    }
  }
  ```

- Update _angular-extension/webview-ui/src/app/app.component.html_ by replacing the content with the following code

  ```html
  <main class="main">
    <h1>Angular Person Editor</h1>
    <div class="content">
      <div class="person">
        <div class="row">
          <label for="firstname">Firstname:</label>
          <div class="value">
            <input
              type="text"
              [formControl]="firstname"
              (input)="updateDocument()"
            />
          </div>
        </div>
        <div class="row">
          <label for="lastname">Lastname:</label>
          <div class="value">
            <input
              type="text"
              [formControl]="lastname"
              (input)="updateDocument()"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
  ```

- Add the following code to the file _angular-extension/webview-ui/src/app/app.component.css_

  ```css
  label {
    font-weight: 600;
    display: block;
  }
  ```

- Verify the changes and launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _Angular Person Editor_
  - This should open the webview with the two input fields

### Install scripts

Like with the Visual Studio Code Extension project before, add a install script to the _angular-extension_ that is called on `postCreateCommand` of the Dev Container. It needs to run `npm install` for the extension and the contained webview-ui project.

- Open the _angular-extension/package.json_ and add the following script to the `scripts` section

  ```json
  "install:all": "npm install && cd webview-ui && npm install",
  ```

- Open the _package.json_ in the repository root and modify the `install:all` script to also handle the _angular-extension_ project

  ```json
  {
    "name": "vscode-theia-cookbook",
    "version": "0.0.0",
    "private": true,
    "scripts": {
      "install:all": "cd vscode-extension && npm install && cd ../angular-extension && npm run install:all"
    }
  }
  ```

### VSCode Elements / VSCode Elements Lite

Like the vanilla HTML, CSS, Javascript example in the first section of this tutorial, the UI components do not look like native Visual Studio Code components. To get a more native Visual Studio Code look and feel you would need to spend quite some time to implement this yourself.

An alterative to implementing this yourself is to use [VSCode Elements](https://vscode-elements.github.io/) or [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/). Unfortunately the implementation of [VSCode Elements](https://vscode-elements.github.io/) is based on the [Lit](https://lit.dev/) library. And using Lit Webcomponents with Angular is not a trivial task.

_**Note:**_  
Searching the web there are approaches that should make it work, by implementing a [ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor) as a [Directive](https://angular.dev/guide/directives/directive-composition-api). This is for example explained somehow in [Master Web Component Forms Integration](https://www.thinktecture.com/en/web-components/web-component-forms-integration-with-lit-and-angular/). Unfortunately I was not able to get this working with VSCode Elements, as the change events were not handled. Somehow it should be possible, but I was missing something. If you have any idea how to make it work, please let me know.

Although I was not able to get VSCode Elements working with an Angular webview, it is possible to at least add the styling by using [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/).

Add `@vscode-elements/elements-lite` as a dependency in the _package.json_ and reference the CSS files in the webview HTML.

- Open a **Terminal**
- Switch to the _angular-extension/webview-ui_ folder
- Install `@vscode-elements/elements-lite` as a `dependency`

  ```
  npm install @vscode-elements/elements-lite
  ```

- Open the file _angular-extension/webview-ui/src/app/app.component.html_
  - Add `class="vscode-label"` to the `label` tags, and `class="vscode-textfield"` to the `input` fields
- Open the file _angular-extension/webview-ui/angular.json_

  - Add the VSCode Elements Lite CSS files to the `architect/build/options/styles`

  ```json
  "styles": [
    "src/styles.css",
    "node_modules/@vscode-elements/elements-lite/components/label/label.css",
    "node_modules/@vscode-elements/elements-lite/components/textfield/textfield.css"
  ],
  ```

If you now restart the application, the input fields in the webview of the custom editor will look like native Visual Studio Code components.

## React Webview Implementation

When discussing about which Javascript framework should be used for implementing the webview, there can be several answers. The most prominent are Angular or React as far as I can tell. There are also others like Vue or Svelte, but well, in that area you are never done.

In the following chapter we create a React project that serves as the webview frontend of the Visual Studio Code Extension.

_**Note:**_  
The following description is based on the [vscode-webview-ui-toolkit-samples Hello World (React + Vite) example](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-vite). I reused several parts of the sample code and adapted it where necessary.  
Also note that I am not an expert in developing React applications. So probably the following sample can be more efficient, but the goal is to help getting started in setting up a Visual Studio Code Extension with a React webview.

- Create a new Visual Studio Code Extension project.

  - Open a **Terminal** and execute the following command

    ```
    yo code
    ```

  - Answer the questions of the wizard for example like shown below:

    ```
    # ? What type of extension do you want to create? New Extension (TypeScript)
    # ? What's the name of your extension? react-extension
    # ? What's the identifier of your extension? react-extension
    # ? What's the description of your extension? LEAVE BLANK
    # ? Initialize a git repository? N
    # ? Which bundler to use? unbundled
    # ? Which package manager to use? npm

    # ? Do you want to open the new folder with Visual Studio Code? Skip
    ```

- Delete the created _react-extension/.vscode_ folder

  ```
  rm -rf react-extension/.vscode
  ```

- Open the _.vscode/launch.json_

  - Add the `extensionDevelopmentPath` to the newly created _react-extension_ to the `args` get both extensions started on launch
  - Add the path to the build result directory of the newly created _react-extension_ to the `outFiles`

    ```json
    {
      "version": "0.2.0",
      "configurations": [
        {
          "name": "Run Extension",
          "type": "extensionHost",
          "request": "launch",
          "args": [
            "--extensionDevelopmentPath=${workspaceFolder}/vscode-extension",
            "--extensionDevelopmentPath=${workspaceFolder}/angular-extension",
            "--extensionDevelopmentPath=${workspaceFolder}/react-extension"
          ],
          "outFiles": [
            "${workspaceFolder}/vscode-extension/out/**/*.js",
            "${workspaceFolder}/angular-extension/dist/**/*.js",
            "${workspaceFolder}/react-extension/out/**/*.js"
          ],
          "preLaunchTask": "${defaultBuildTask}"
        }
      ]
    }
    ```

To create a React application you typically use either [CRA](https://create-react-app.dev/) or [Vite](https://vite.dev/guide/).
I tried to use CRA and came across issue [React Issue 32016](https://github.com/facebook/react/issues/32016).
There is a statement that "CRA has become somewhat outdated".
Instead of trying to workaround the issue, I therefore decided to switch to [Vite](https://vite.dev/guide/) directly.

- Create a React App using [Vite](https://vite.dev/guide/)

  - Open a **Terminal**
  - Switch to the _react-extension_ folder
  - Execute the following command to create the react application

    ```
    npm create vite@latest webview-ui
    ```

    The wizard will ask the following questions. Answer them for example like shown below:

    ```console
    Need to install the following packages:
    create-vite@6.1.1
    Ok to proceed? (y) y


    > react-extension@0.0.1 npx
    > create-vite webview-ui

    ✔ Select a framework: › React
    ✔ Select a variant: › TypeScript
    ```

    This command creates a new React project in the Typescript variant in the folder _react-extension/webview-ui_.

  - Switch to the new generated `webview-ui` folder and install the dependencies

    ```
    cd webview-ui
    npm install
    ```

  - Update the _launch.json_

    - Add the following configuration to _.vscode/launch.json_

      ```json
      {
        "name": "Start React",
        "type": "chrome",
        "request": "launch",
        "preLaunchTask": "npm: dev",
        "url": "http://localhost:5173/",
        "webRoot": "${workspaceFolder}/react-extension/webview-ui"
      }
      ```

  - Update the _tasks.json_

    - Add the following configuration to _.vscode/tasks.json_ and add the `cwd` option

      ```json
      {
        "type": "npm",
        "script": "dev",
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
              "regexp": "VITE v(.*)  ready in \\d* ms"
            }
          }
        },
        "options": {
          "cwd": "${workspaceFolder}/react-extension/webview-ui"
        }
      }
      ```

  - Update the _react-extension/webview-ui/package.json_

    - Change the `name` to `react-webview-ui`
    - Update the `dev` script to ensure that the server is started on port 5173

      ```json
      "dev": "vite --port 5173",
      ```

  To verify that the setup works, you can now either run the task via

- Press _F1_ - _Tasks: Run Task_ - _npm:dev_
- Run the launch configuration via _Run and Debug_ - Select _Start React_ in the dropdown - _Start Debugging_

This will start the React + Vite + TS application and host it via http://localhost:5173.

### Prepare the React application as webview

In the next steps the two projects need to be configured so the React application can be used as webview in the Visual Studio Code Extension.

- Update _react-extension/tsconfig.json_

  - Change the `outDir` to `./dist`  
    This might not be really necessary, but having a good naming convention for the folders helps in understanding the structure. The `dist` folder will contain the content that gets distributed in the packaged Visual Studio Code Extension.
  - Add `DOM` to the `lib` configuration
  - Configure `exclude` to avoid `node_modules` and `webview-ui` being included in the codebase

    ```json
    {
      "compilerOptions": {
        "module": "Node16",
        "target": "ES2022",
        "outDir": "./dist",
        "lib": ["ES2022", "DOM"],
        "sourceMap": true,
        "rootDir": "src",
        "strict": true
      },
      "exclude": ["node_modules", ".vscode-test", "webview-ui"]
    }
    ```

- Update _react-extension/package.json_
  - Change `main` to point to `./dist/extension.js`
- Update _.vscode/launch.json_
  - Correct the `outFiles` value to `"${workspaceFolder}/react-extension/dist/**/*.js"`
- Update _react-extension/.vscodeignore_ to ignore all _webview-ui_ files except the _build_ directory

  ```
  # Ignore extension configs
  .vscode/**

  # Ignore test files
  .vscode-test/**
  out/test/**

  # Ignore source code
  src/**

  # Ignore all webview-ui files except the build directory
  webview-ui/src/**
  webview-ui/public/**
  webview-ui/scripts/**
  webview-ui/index.html
  webview-ui/README.md
  webview-ui/package.json
  webview-ui/package-lock.json
  webview-ui/node_modules/**

  # Ignore Misc
  .yarnrc
  vsc-extension-quickstart.md
  **/.gitignore
  **/tsconfig.json
  **/vite.config.ts
  **/.eslintrc.json
  **/*.map
  **/*.ts
  ```

- Update the _react-extension/webview-ui/vite.config.ts_

  - Add `build` options to specify the output folder and the `rollupOptions` to disable the filename hashing in the build result and configure a relative base path via `base: ""` as described in [vite.dev - Public Base Path](https://vite.dev/guide/build.html#public-base-path)

    ```typescript
    import { defineConfig } from "vite";
    import react from "@vitejs/plugin-react";

    // https://vite.dev/config/
    export default defineConfig({
      plugins: [react()],
      base: "",
      build: {
        outDir: "build",
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: `assets/[name].[ext]`,
          },
        },
      },
    });
    ```

- Delete the file _vite.config.js_ and _vite.config.map.js_ if they exist
- Update _react-extension/webview-ui/.gitignore_
  - Add the _build_ folder
- After we changed the output folder to _build_ in the _vite.config.ts_ you can delete the folder _react-extension/webview-ui/dist_ if it was already created.
- After we changed the output folder to _dist_ in the _tsconfig.json_ you can delete the folder _react-extension/out_ if it was already created.

Test if the build succeeds

- Open a **Terminal**
  - Switch to the _react-extension/webview-ui_ folder
  - Call `npm run build`  
    This should create the folder _react-extension/webview-ui/build_
  - Switch to the _react-extension_ folder
  - Call `npm run compile`  
    This should create the folder _react-extension/dist_

### Use the React Application as webview

The next step is to use the React Application as a Visual Studio Code Extension WebView.
For this we need to perform the same steps as described previously in [Implement the Visual Studio Code Extension](#implement-the-visual-studio-code-extension).

- Open the _react-extension/package.json_

  - Replace the `contributes` section with the following snippet:

    ```json
    "contributes": {
      "customEditors": [
        {
          "viewType": "react-extension.personEditor",
          "displayName": "React Person Editor",
          "selector": [
            {
              "filenamePattern": "*.person"
            }
          ]
        }
      ]
    },
    ```

- Create a new file _react-extension/src/personEditor.ts_

  - Copy the content from _vscode-extension/src/personEditor.ts_  
    _**Note:**_  
    If you have not created that file in the previous vanilla HTML, CSS, Javascript part, follow the steps in [Implement the Visual Studio Code Extension](#implement-the-visual-studio-code-extension)
  - Change the value of `viewType` to `react-extension.personEditor`

    ```typescript
    private static readonly viewType = "react-extension.personEditor";
    ```

  - Optional:  
    Extend the `webview.options` to restrict the webview to only load resources from _dist_ and _webview-ui/build_ directories

    ```typescript
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      // Enable scripts in the webview
      enableScripts: true,

      // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "webview-ui/build"),
      ],
    };
    ```

  - Change the implementation of `getWebviewHtml()` so that it basically returns the same HTML as in _react-extension/webview-ui/index.html_. But instead of relative URLs to resources like CSS and the Javascript files, special WebView URIs are used. This is necessary so the resources can be correctly resolved inside a webview, which is described in [Loading local content](https://code.visualstudio.com/api/extension-guides/webview#loading-local-content).

    ```typescript
    /**
     * Get the static html used for the editor webviews.
     */
    private getWebviewHtml(webview: vscode.Webview): string {
      // The CSS file from the React build output
      const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "webview-ui",
          "build",
          "assets",
          "index.css"
        )
      );
      // The JS file from the React build output
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "webview-ui",
          "build",
          "assets",
          "index.js"
        )
      );

      const nonce = this.getNonce();

      // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
      return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src ${webview.cspSource}; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>Person Editor</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
    }
    ```

- Change the content of _react-extension/src/extension.ts_

  - Replace the content with the following code

    ```typescript
    // The module 'vscode' contains the Visual Studio Code extensibility API
    // Import the module and reference it with the alias vscode in your code below
    import * as vscode from "vscode";
    import { PersonEditorProvider } from "./personEditor";

    // This method is called when your extension is activated
    export function activate(context: vscode.ExtensionContext) {
      // Register our custom editor provider
      context.subscriptions.push(PersonEditorProvider.register(context));
    }

    // This method is called when your extension is deactivated
    export function deactivate() {}
    ```

### Script Updates

We now have a React application project as frontend inside a Visual Studio Code Extension project.
The build and run scripts are not automatically connected.
For example, if you change code in the React application and then launch the Visual Studio Code Extension, the changes are not automatically reflected.
This is because the Visual Studio Code Extension is using the build results of the React Application, and not the sources.

To connect the two projects, we need to update the `scripts` section in _react-extension/webview-ui/package.json_ and _react-extension/package.json_

_**Note:**_  
The `watch` script needs to execute the watch operations in parallel and not sequentially.
While one solution to this could be the usage of `&` instead of `&&` on a Unix system, a better and OS independent solution is the usage of [`concurrently`](https://www.npmjs.com/package/concurrently).

- Open the file _react-extension/webview-ui/package.json_

  - Add the following watch script, which is needed because the Visual Studio Code Extension consumes the created static site  
    See [Building for Production](https://vite.dev/guide/build)
    ```json
    "watch": "vite build --watch"
    ```

- Add `concurrently` as a `devDependency` to the _react-extension/package.json_

  - Open a **Terminal**
  - Switch to the _react-extension_ folder
  - Execute the following command

    ```
    npm i -D concurrently
    ```

- Open _react-extension/package.json_

  - Add `scripts` for the _webview-ui_

    ```json
    "start:webview": "npm --prefix webview-ui run dev",
    "build:webview": "npm --prefix webview-ui run build",
    "watch:webview": "npm --prefix webview-ui run watch",
    ```

  - Update `vscode:prepublish` to call the `build:webview` script additionally

    ```json
    "vscode:prepublish": "npm run build:webview && npm run compile",
    ```

  - Update the `watch` script to call also `watch:webview` by using `concurrently`

    ```json
    "watch": "concurrently --kill-others \"npm run watch:webview\" \"tsc -watch -p ./\"",
    ```

To make the updated `watch` script also work when launching the extension, the corresponding task in _.vscode/tasks.json_ needs to be updated like this (notice the `endsPattern`):

If you only want to watch the _react-extension_, update the configuration like this (notice the `endsPattern`). Replace the `npm:watch` script at the top of the _tasks.json_.

```json
{
  "type": "npm",
  "script": "watch",
  "problemMatcher": {
    "base": "$tsc-watch",
    "background": {
      "activeOnStart": true,
      "beginsPattern": {
        "regexp": "(.*?)"
      },
      "endsPattern": {
        "regexp": "built in \\d*ms"
      }
    }
  },
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "options": {
    "cwd": "${workspaceFolder}/react-extension"
  }
},
```

If you want to watch the _vscode-extension_, the _angular-extension_ and the _react-extension_ at the same time, update the configuration like this:

```json
{
  "label": "Watch Extensions",
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "dependsOn": [
    "VS Code Extension Watch",
    "Angular Extension Watch",
    "React Extension Watch"
  ]
},
{
  "label": "VS Code Extension Watch",
  "type": "shell",
  "command": "npm run watch",
  "problemMatcher": "$tsc-watch",
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build"
  },
  "options": {
    "cwd": "${workspaceFolder}/vscode-extension"
  }
},
{
  "label": "Angular Extension Watch",
  "type": "shell",
  "command": "npm run watch",
  "problemMatcher": {
    "base": "$tsc-watch",
    "background": {
      "activeOnStart": true,
      "beginsPattern": {
        "regexp": "(.*?)"
      },
      "endsPattern": {
        "regexp": "bundle generation complete"
      }
    }
  },
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build"
  },
  "options": {
    "cwd": "${workspaceFolder}/angular-extension"
  }
},
{
  "label": "React Extension Watch",
  "type": "shell",
  "command": "npm run watch",
  "problemMatcher": {
    "base": "$tsc-watch",
    "background": {
      "activeOnStart": true,
      "beginsPattern": {
        "regexp": "(.*?)"
      },
      "endsPattern": {
        "regexp": "built in \\d*ms"
      }
    }
  },
  "isBackground": true,
  "presentation": {
    "reveal": "never"
  },
  "group": {
    "kind": "build",
  },
  "options": {
    "cwd": "${workspaceFolder}/react-extension"
  }
},
```

The above snippet defines a _Compound Task_, makes it the default task that should be executed via _launch.json_ `preLaunchTask` configuration and changes the task types from `npm` to `shell`.
This change is necessary because otherwise there is a name collision in the _Task auto-detection_.

To verify that it works

- Launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _React Person Editor_

This should open the webview with the content of the React application

- In the Visual Studio Code instance that is used for development, open the file _react-extension/webview-ui/src/App.tsx_
- Change something in code, e.g. by adding `May the force by with you`, and save the changes
- Switch to the Visual Studio Code instance launched for testing the extension
  - Either close and reopen the webview
  - Reload the webview by pressing F1 - _Developer: Reload Webviews_

You should now see the applied changes.

- In the Visual Studio Code instance that is used for development, open the file _react-extension/src/personEditor.ts_
- Change for example the webview HTML by adding `<p>Hello World</p>` in the `<body>`.
- Switch to the Visual Studio Code instance launched for testing the extension
- Reload the **Extension Development Host** so that it picks up the changes. You have two options to do this:
  - Click on the debug restart action
  - Press `Ctrl + R` / `Cmd + R` in the **Extension Development Host** window

You should see the applied changes now. If not reopen the webview and verify that the applied changes are visible.

_**Note:**_  
Don't forget to remove the modification to the webview HTML, so it does not affect the next steps.

### React Editor Implementation

The next step is to implement a custom editor, just like in the examples before.
It uses the same principles with regards to communication between extension and webview, and looks quite the same.
But of course we use React for the UI implementation.

- Add `@types/vscode-webview` as a `devDependency` to the _react-extension/webview-ui_ project

  - Open a **Terminal**
  - Switch to the folder _react-extension/webview-ui_
  - Run the following command

    ```
    npm i -D @types/vscode-webview
    ```

- Create a new folder _angular-extension/webview-ui/src/utilities_
- Create a new file _vscode.ts_ in the new folder

  - Add the following code, which is a copy of [vscode-webview-ui-toolkit-samples](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/frameworks/hello-world-react-vite/webview-ui/src/utilities/vscode.ts)

    ```typescript
    import type { WebviewApi } from "vscode-webview";

    /**
     * A utility wrapper around the acquireVsCodeApi() function, which enables
     * message passing and state management between the webview and extension
     * contexts.
     *
     * This utility also enables webview code to be run in a web browser-based
     * dev server by using native web browser features that mock the functionality
     * enabled by acquireVsCodeApi.
     */
    class VSCodeAPIWrapper {
      private readonly vsCodeApi: WebviewApi<unknown> | undefined;

      constructor() {
        // Check if the acquireVsCodeApi function exists in the current development
        // context (i.e. VS Code development window or web browser)
        if (typeof acquireVsCodeApi === "function") {
          this.vsCodeApi = acquireVsCodeApi();
        }
      }

      /**
       * Post a message (i.e. send arbitrary data) to the owner of the webview.
       *
       * @remarks When running webview code inside a web browser, postMessage will instead
       * log the given message to the console.
       *
       * @param message Abitrary data (must be JSON serializable) to send to the extension context.
       */
      public postMessage(message: unknown) {
        if (this.vsCodeApi) {
          this.vsCodeApi.postMessage(message);
        } else {
          console.log(message);
        }
      }

      /**
       * Get the persistent state stored for this webview.
       *
       * @remarks When running webview source code inside a web browser, getState will retrieve state
       * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
       *
       * @return The current state or `undefined` if no state has been set.
       */
      public getState(): unknown | undefined {
        if (this.vsCodeApi) {
          return this.vsCodeApi.getState();
        } else {
          const state = localStorage.getItem("vscodeState");
          return state ? JSON.parse(state) : undefined;
        }
      }

      /**
       * Set the persistent state stored for this webview.
       *
       * @remarks When running webview source code inside a web browser, setState will set the given
       * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
       *
       * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
       * using {@link getState}.
       *
       * @return The new state.
       */
      public setState<T extends unknown | undefined>(newState: T): T {
        if (this.vsCodeApi) {
          return this.vsCodeApi.setState(newState);
        } else {
          localStorage.setItem("vscodeState", JSON.stringify(newState));
          return newState;
        }
      }
    }

    // Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
    export const vscode = new VSCodeAPIWrapper();
    ```

  - The `VSCodeAPIWrapper` is used for
    - Aquiring the VSCode API
    - Managing the persistent state of the webview
    - Posting messages from the webview to the extension

- Replace the content of _react-extension/webview-ui/src/App.tsx_ with the following snippet

  ```typescript
  import { useState } from "react";
  import { vscode } from "./utilities/vscode";
  import "./App.css";

  function App() {
    const [personObject, setPersonObject] = useState(loadState);

    /**
     * Load the initial state via vscode API or return an empty object as initial state.
     */
    function loadState() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = vscode.getState() as any;
      if (state) {
        return JSON.parse(state.text);
      }

      return {
        firstname: "",
        lastname: "",
      };
    }

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case "update": {
          const text = message.text;

          // Update our webview's content
          updateContent(text);

          // Then persist state information.
          // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
          vscode.setState({ text });

          return;
        }
      }
    });

    /**
     * Update the data shown in the document in the webview.
     */
    function updateContent(text: string) {
      if (text !== "") {
        const parsed = JSON.parse(text);
        setPersonObject({
          firstname: parsed.firstname,
          lastname: parsed.lastname,
        });
      }
    }

    /**
     * Update the document in the extension.
     */
    function updateDocument() {
      vscode.postMessage({
        type: "updateDocument",
        text: JSON.stringify(personObject, null, 2),
      });
    }

    return (
      <>
        <main className="main">
          <h1>React Person Editor</h1>
          <div className="content">
            <div className="person">
              <div className="row">
                <label htmlFor="firstname">Firstname:</label>
                <div className="value">
                  <input
                    type="text"
                    id="firstname"
                    value={personObject.firstname}
                    onChange={(event) => {
                      personObject.firstname = event.target.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <label htmlFor="lastname">Lastname:</label>
                <div className="value">
                  <input
                    type="text"
                    id="lastname"
                    value={personObject.lastname}
                    onChange={(event) => {
                      personObject.lastname = event.target.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  export default App;
  ```

- Update _react-extension/webview-ui/src/index.css_
  - Delete the whole content of the file
- Replace the content of _react-extension/webview-ui/src/App.css_ with the following snippet

  ```css
  label {
    font-weight: 600;
    display: block;
  }
  ```

- Verify the changes and launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _React Person Editor_
  - This should open the webview with the two input fields

### Install scripts

Like with the Visual Studio Code Extension project and the Angular project before, add a install script to the _react-extension_ that is called on `postCreateCommand` of the Dev Container. It needs to run `npm install` for the extension and the contained webview-ui project.

- Open the _react-extension/package.json_ and add the following script to the `scripts` section

  ```json
  "install:all": "npm install && cd webview-ui && npm install",
  ```

- Open the _package.json_ in the repository root and modify the `install:all` script to also handle the _react-extension_ project

  ```json
  {
    "name": "vscode-theia-cookbook",
    "version": "0.0.0",
    "private": true,
    "scripts": {
      "install:all": "cd vscode-extension && npm install && cd ../angular-extension && npm run install:all && cd ../react-extension && npm run install:all"
    }
  }
  ```

### VSCode Elements Lite

Like the vanilla HTML, CSS, Javascript example in the first section of this tutorial, the UI components do not look like native Visual Studio Code components. To get a more native Visual Studio Code look and feel you would need to spend quite some time to implement this yourself.

To avoid this effort, we can also use the [VSCode Elements](https://vscode-elements.github.io/) component library, or in case of vanilla HTML and CSS, [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/).

As a first step, we will only use the styling variant by using [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/).

Add `@vscode-elements/elements-lite` as a dependency in the _package.json_ and reference the CSS files in the webview HTML.

- Open a **Terminal**
- Switch to the _react-extension/webview-ui_ folder
- Install `@vscode-elements/elements-lite` as a `dependency`

  ```
  npm install @vscode-elements/elements-lite
  ```

- Open the file _react-extension/webview-ui/src/App.tsx_

  - Import the VSCode Elements Lite CSS files

    ```typescript
    import "../node_modules/@vscode-elements/elements-lite/components/label/label.css";
    import "../node_modules/@vscode-elements/elements-lite/components/textfield/textfield.css";
    ```

  - Add `className="vscode-label"` to the `label` tags, and `className="vscode-textfield"` to the `input` fields

    ```typescript
    return (
      <>
        <main className="main">
          <h1>React Person Editor</h1>
          <div className="content">
            <div className="person">
              <div className="row">
                <label htmlFor="firstname" className="vscode-label">
                  Firstname:
                </label>
                <div className="value">
                  <input
                    type="text"
                    id="firstname"
                    className="vscode-textfield"
                    value={personObject.firstname}
                    onChange={(event) => {
                      personObject.firstname = event.target.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <label htmlFor="lastname" className="vscode-label">
                  Lastname:
                </label>
                <div className="value">
                  <input
                    type="text"
                    id="lastname"
                    className="vscode-textfield"
                    value={personObject.lastname}
                    onChange={(event) => {
                      personObject.lastname = event.target.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
    ```

If you now restart the application, the input fields in the webview of the custom editor will look like native Visual Studio Code components.

### VSCode Elements

If you like to use the Javascript enabled web components, you can use the [VSCode Elements](https://vscode-elements.github.io/) component library.
In the previous section we only applied the styling approach by using VSCode Elements Lite.
But since React 19 web components are fully supported, therefore it is easy to use them directly.

Add `@vscode-elements/elements` as a dependency in the _package.json_ and reference the CSS files in the webview HTML.

- Open a **Terminal**
- Switch to the _react-extension/webview-ui_ folder
- Install `@vscode-elements/elements` as a `dependency`

  ```
  npm install @vscode-elements/elements
  ```

To use custom tag names, you must configure the TypeScript parser to recognize the custom elements.
This can be done via a TypeScript definition.

- Create the file _react-extension/webview-ui/src/global.d.ts_

  - Add the following content

    ```typescript
    import { VscodeLabel, VscodeTextfield } from "@vscode-elements/elements";

    type ElementProps<I> = Partial<Omit<I, keyof HTMLElement>>;
    type CustomEventHandler<E> = (e: E) => void;

    type WebComponentProps<I extends HTMLElement> = React.DetailedHTMLProps<
      React.HTMLAttributes<I>,
      I
    > &
      ElementProps<I>;

    declare module "react" {
      namespace JSX {
        interface IntrinsicElements {
          "vscode-label": WebComponentProps<VscodeLabel>;
          "vscode-textfield": WebComponentProps<VscodeTextfield>;
        }
      }
    }
    ```

    _**Note:**_  
    A more complete example TypeScript definition can be found in the [VSCode Elements Examples Repository](https://github.com/vscode-elements/examples/blob/react-vite/react-vite/src/global.d.ts).

- Update the file _react-extension/webview-ui/src/App.tsx_

  - Add the imports for `vscode-label` and `vscode-textfield`  
    If you applied the VSCode Elements Lite CSS files before, replace them with the following imports.

    ```typescript
    import "@vscode-elements/elements/dist/vscode-label";
    import "@vscode-elements/elements/dist/vscode-textfield";
    ```

  - Replace the `label` tag with `vscode-label`, and the `input` tag with `vscode-textfield`
  - Remove the `className` attributes if you applied the VSCode Elements Lite CSS before.
  - For `vscode-textfield` replace the `onChange` with `onInput`  
    _**Note:**_  
    React chose to make `onChange` behave like `onInput`.
    The VSCode Elements web component library does not follow this decision.
    Therefore we need to change `onChange` to `onInput` to achieve the same behavior as before.
  - In the `onInput` function retrieve the value via `event.currentTarget.value`

    ```typescript
    return (
      <>
        <main className="main">
          <h1>React Person Editor</h1>
          <div className="content">
            <div className="person">
              <div className="row">
                <vscode-label htmlFor="firstname">Firstname:</vscode-label>
                <div className="value">
                  <vscode-textfield
                    type="text"
                    id="firstname"
                    value={personObject.firstname}
                    onInput={(event) => {
                      personObject.firstname = event.currentTarget.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <vscode-label htmlFor="lastname">Lastname:</vscode-label>
                <div className="value">
                  <vscode-textfield
                    id="lastname"
                    value={personObject.lastname}
                    onInput={(event) => {
                      personObject.lastname = event.currentTarget.value;
                      updateDocument();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
    ```

If you now restart the application, the input fields in the webview of the custom editor will look and behave like native Visual Studio Code components.

## Conclusion

At the end this blog post got again longer than I initially intended.
And it contains more information than I planned.
But as I use my blog posts as _my external memory_ I am quite satisfied with the outcome.

To summarize again what the blog post covered:

- Getting started with Visual Studio Code Extension development
- Creation of a custom Visual Studio Code Editor using Webviews
- Creating a Webview using
  - Vanilla HTML, CSS and Javascript
  - Angular
  - React
- Usage of VSCode Elements to get an almost native Visual Studio Code look and feel

If you have any improvements you would like to share, feel free to open an issue in the corresponding Github repository.
I am happy to learn and to improve this blog post and my external memory.

The sources for this and the following tutorials are located in my [Github repository](https://github.com/fipro78/vscode_theia_cookbook).

I hope you enjoyed this tutorial and I could share some information that I had to gather via various resources.

## Link Collection

- [Tutorial Sources](https://github.com/fipro78/vscode_theia_cookbook)
- Visual Studio Code Resources
  - [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
  - [Webview API Sample](https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample)
  - [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
  - [Custom Editor API Samples](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample)
  - [vscode-webview-ui-toolkit-samples (deprecated)](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks)
- [angular.dev - Docs](https://angular.dev/overview)
- [react.dev - Learn React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [VSCode Elements](https://vscode-elements.github.io/)
- [VSCode Elements Lite](https://vscode-elements.github.io/elements-lite/)
