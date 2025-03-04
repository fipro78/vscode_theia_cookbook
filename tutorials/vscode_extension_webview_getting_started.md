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
