# Multiple webviews in a single Visual Studio Code Extension

In my previous blog post [Getting Started with Visual Studio Code Extension Development](./vscode_extension_webview_getting_started.md) I described how to create a Visual Studio Code Extension that contributes a custom editor that is implemented using a webview. And I compared how this can be done using vanilla HTML and Javascript, using Angular and using React. Only a single webview is contributed by each Visual Studio Code Extension in the examples of that blog post, which is sufficient for a lot of use cases. But after the publishing of that blog post I was asked several times how to contribute multiple editors with a single extension. It turned out that this is not as intuitive as initially thought, so I decided to write a new blog post dedicated to this topic.

To demonstrate the solutions for the different variants I will add a simple pet editor to the extensions.

**_Note:_**  
The following content is based on the [Getting Started with Visual Studio Code Extension Development](./vscode_extension_webview_getting_started.md) blog post. If you want to follow the steps described in this post, work through the previous blog post or get the sources from the [getting_started branch](https://github.com/fipro78/vscode_theia_cookbook/tree/getting_started).

## Visual Studio Code Extension Project

Let's start by adding a second custom editor to the Vanilla HTML and Javascript Visual Studio Code Extension.

- Open the _vscode-extension/package.json_

  - Extend the `contributes` section to add a Pet editor for the **.pet** file extension:

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
      },
      {
          "viewType": "vscode-extension.petEditor",
          "displayName": "Visual Studio Code Pet Editor",
          "selector": [
          {
              "filenamePattern": "*.pet"
          }
          ],
          "priority": "default"
      }
      ]
  },
  ```

- Create a new file _vscode-extension/src/abstractEditor.ts_  
  To avoid that we need to copy a lot of code for the new editor, we create an abstract base class `AbstractEditorProvider` that will be used by both editor implementations.

  - Copy the content of _vscode-extension/src/personEditor.ts_ to _vscode-extension/src/abstractEditor.ts_
  - Rename `PersonEditorProvider` to `AbstractEditorProvider` and make it `abstract`
  - Remove the `viewType` constant, the `constructor` and the `register` method
  - Change the visibility of `getWebviewHtml()` method to `protected` and make it `abstract`

  ```typescript
  import * as vscode from "vscode";

  export abstract class AbstractEditorProvider
    implements vscode.CustomTextEditorProvider
  {
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

      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            this.updateWebview(webviewPanel, document);
          }
        });

      // Make sure we get rid of the listener when our editor is closed.
      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });

      // Receive message from the webview.
      webviewPanel.webview.onDidReceiveMessage((e) => {
        switch (e.type) {
          case "updateDocument":
            this.updateDocument(document, e.text);
            return;
        }
      });

      this.updateWebview(webviewPanel, document);
    }

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
    protected abstract getWebviewHtml(webview: vscode.Webview): string;

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
  }
  ```

- Update the file _vscode-extension/src/personEditor.ts_

  - Extend `AbstractEditorProvider`
  - Call `super()` in the `constructor`
  - Change the visibility of `getWebviewHtml()` to `protected`
  - Delete the other methods that are now defined in `AbstractEditorProvider`

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PersonEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "vscode-extension.personEditor";

    constructor(private readonly context: vscode.ExtensionContext) {
      super();
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PersonEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PersonEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    /**
     * Get the static html used for the editor webviews.
     */
    protected getWebviewHtml(webview: vscode.Webview): string {
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
  }
  ```

- Create a new file _vscode-extension/src/petEditor.ts_

  - Copy the content of _vscode-extension/src/personEditor.ts_
  - Rename the class to `PetEditorProvider`
  - Update the value of `viewType` to `"vscode-extension.petEditor"`
  - Update the `register()` implementation to register the `PetEditorProvider`
  - Update the `getWebviewHtml()` implementation to return the HTML for a pet editor

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PetEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "vscode-extension.petEditor";

    constructor(private readonly context: vscode.ExtensionContext) {
      super();
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PetEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PetEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    /**
     * Get the static html used for the editor webviews.
     */
    protected getWebviewHtml(webview: vscode.Webview): string {
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
  
            <title>Pet Editor</title>
        </head>
        <body>
            <h1>Visual Studio Code Pet Editor</h1>
            <div class="pet">
                <div class="row">
                    <vscode-label for="name">Name:</vscode-label>
                    <div class="value">
                        <vscode-textfield type="text" id="name"/>
                    </div>
                </div>
                <div class="row">
                    <vscode-label for="species">Species:</vscode-label>
                    <div class="value">
                        <vscode-single-select id="species">
                            <vscode-option>-</vscode-option>
                            <vscode-option description="bird">Bird</vscode-option>
                            <vscode-option description="cat">Cat</vscode-option>
                            <vscode-option description="dog">Dog</vscode-option>
                        </vscode-single-select>
                    </div>
                </div>
            </div>
  
            <script nonce="${nonce}" src="${scriptUri}"></script>
            <script nonce="${nonce}" src="${elementsUri}" type="module"></script>
        </body>
        </html>`;
    }
  }
  ```

- Update the file _vscode-extension/media/main.js_ so the code is able to handle _persons_ and _pets_

  ```javascript
  // Script run within the webview itself.
  (function () {
    // Get a reference to the Visual Studio Code webview api.
    // We use this API to post messages back to our extension.

    const vscode = acquireVsCodeApi();

    const personContainer = /** @type {HTMLElement} */ (
      document.querySelector(".person")
    );
    const petContainer = /** @type {HTMLElement} */ (
      document.querySelector(".pet")
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
        if (personContainer) {
          personContainer.style.display = "none";
        }
        if (petContainer) {
          petContainer.style.display = "none";
        }
        errorContainer.innerText = "Error: Document is not valid json";
        errorContainer.style.display = "";
        return;
      }
      if (personContainer) {
        personContainer.style.display = "";
      }
      if (petContainer) {
        petContainer.style.display = "";
      }
      errorContainer.style.display = "none";

      const firstname = document.getElementById("firstname");
      const lastname = document.getElementById("lastname");

      const name = document.getElementById("name");
      const species = document.getElementById("species");

      if (firstname && lastname) {
        if (json.firstname) {
          firstname.value = json.firstname;
        }
        if (json.lastname) {
          lastname.value = json.lastname;
        }

        firstname.oninput = () => {
          let value = firstname.value;
          // wait 500 ms before updating the document
          // only update if in the meantime no other input was given
          setTimeout(() => {
            if (value === firstname.value) {
              json.firstname = firstname.value;
              vscode.postMessage({
                type: "updateDocument",
                text: JSON.stringify(json, null, 2),
              });
            }
          }, 500);
        };

        lastname.oninput = () => {
          let value = lastname.value;
          // wait 500 ms before updating the document
          // only update if in the meantime no other input was given
          setTimeout(() => {
            if (value === lastname.value) {
              json.lastname = lastname.value;
              vscode.postMessage({
                type: "updateDocument",
                text: JSON.stringify(json, null, 2),
              });
            }
          }, 500);
        };
      }

      if (name && species) {
        if (json.name) {
          name.value = json.name;
        }
        if (json.species) {
          species.value = json.species;
        }

        name.oninput = () => {
          let value = name.value;
          // wait 500 ms before updating the document
          // only update if in the meantime no other input was given
          setTimeout(() => {
            if (value === name.value) {
              json.name = name.value;
              vscode.postMessage({
                type: "updateDocument",
                text: JSON.stringify(json, null, 2),
              });
            }
          }, 500);
        };

        species.oninput = () => {
          let value = species.value;
          // wait 500 ms before updating the document
          // only update if in the meantime no other input was given
          setTimeout(() => {
            if (value === species.value) {
              json.species = species.value;
              vscode.postMessage({
                type: "updateDocument",
                text: JSON.stringify(json, null, 2),
              });
            }
          }, 500);
        };
      }
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

- Update _vscode-extension/src/extension.ts_

  - Register the `PetEditorProvider`

  ```typescript
  // The module 'vscode' contains the Visual Studio Code extensibility API
  // Import the module and reference it with the alias vscode in your code below
  import * as vscode from "vscode";
  import { PersonEditorProvider } from "./personEditor";
  import { PetEditorProvider } from "./petEditor";

  // This method is called when your extension is activated
  export function activate(context: vscode.ExtensionContext) {
    // Register our custom editor provider
    context.subscriptions.push(PersonEditorProvider.register(context));
    context.subscriptions.push(PetEditorProvider.register(context));
  }

  // This method is called when your extension is deactivated
  export function deactivate() {}
  ```

If everything is correctly in place, you can verify the editor by

- pressing F5 to start a new Visual Studio Code instance with the extension
- opening a folder somewhere  
  Create a folder _example_ in the home directory of the _node_ user in the Dev Container for example.
- creating a new file named _santas.pet_

Now a webview with two input fields should be visible.

- enter values for _Name_ and _Species_,  
  _e.g. Name: Santa's little helper, Species: Dog_
- Save via _CTRL + S_
- Right click on the created file in the _Explorer_
- Select _Open With..._ - _Text Editor_

The default text editor should open with the JSON content of the created file.

## Angular Webview Implementation

To provide multiple webviews in an extension that uses Angular as webframework, there is some more work to do.
In the [Getting Started with Visual Studio Code Extension Development - Angular Webview Implementation](./vscode_extension_webview_getting_started.md#angular-webview-implementation) I implemented the webview as a [Angular Standalone Component](https://blog.angular-university.io/angular-standalone-components/) and I removed the `RouterOutlet` to make the usage of assets from third-party modules work correctly.

The following section describes how to add a second custom editor to the Angular Visual Studio Code Extension.

- Open the _angular-extension/package.json_

  - Extend the `contributes` section to add a Pet editor for the **.pet** file extension:

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
        ],
        "priority": "option"
      },
      {
        "viewType": "angular-extension.petEditor",
        "displayName": "Angular Pet Editor",
        "selector": [
          {
            "filenamePattern": "*.pet"
          }
        ],
        "priority": "option"
      }
    ]
  },
  ```

- Create a new file _angular-extension/src/abstractEditor.ts_  
  To avoid that we need to copy a lot of code for the new editor, we create an abstract base class `AbstractEditorProvider` that will be used by both editor implementations.

  - Copy the content of _angular-extension/src/personEditor.ts_ to _angular-extension/src/abstractEditor.ts_
  - Rename `PersonEditorProvider` to `AbstractEditorProvider` and make it `abstract`
  - Remove the `viewType` constant and the `register` method
  - Add an abstract method `getRootComponentSelector()`
  - Update `getWebviewHtml()` to use `getRootComponentSelector()` as the app root component and as an attribute `data-root` in the `html` tag

  ```typescript
  import * as vscode from "vscode";

  export abstract class AbstractEditorProvider
    implements vscode.CustomTextEditorProvider
  {
    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
      document: vscode.TextDocument,
      webviewPanel: vscode.WebviewPanel,
      _token: vscode.CancellationToken
    ): Promise<void> {
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

      webviewPanel.webview.html = this.getWebviewHtml(webviewPanel.webview);

      // Hook up event handlers so that we can synchronize the webview with the text document.
      //
      // The text document acts as our model, so we have to sync change in the document to our
      // editor and sync changes in the editor back to the document.
      //
      // Remember that a single text document can also be shared between multiple custom
      // editors (this happens for example when you split a custom editor)

      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            this.updateWebview(webviewPanel, document);
          }
        });

      // Make sure we get rid of the listener when our editor is closed.
      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });

      // Receive message from the webview.
      webviewPanel.webview.onDidReceiveMessage((e) => {
        switch (e.type) {
          case "updateDocument":
            this.updateDocument(document, e.text);
            return;
        }
      });

      this.updateWebview(webviewPanel, document);
    }

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

      const rootSelector = this.getRootComponentSelector();
      const nonce = this.getNonce();

      // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
      return /*html*/ `
        <!DOCTYPE html>
        <html lang="en" data-root="${rootSelector}">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
        </head>
        <body>
            <${rootSelector}></${rootSelector}>
            <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
      `;
    }

    /**
     * Return the selector of the root component to use.
     */
    abstract getRootComponentSelector(): string;

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
  }
  ```

- Update the file _angular-extension/src/personEditor.ts_

  - Extend `AbstractEditorProvider`
  - Call `super(context)` in the `constructor`
  - Add the `getRootComponentSelector()` method which returns `person-root`
  - Delete the other methods that are now defined in `AbstractEditorProvider`

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PersonEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "angular-extension.personEditor";

    constructor(context: vscode.ExtensionContext) {
      super(context);
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PersonEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PersonEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    getRootComponentSelector(): string {
      return "person-root";
    }
  }
  ```

- Create a new file _angular-extension/src/petEditor.ts_

  - Copy the content of _angular-extension/src/personEditor.ts_
  - Rename the class to `PetEditorProvider`
  - Update the value of `viewType` to `"angular-extension.petEditor"`
  - Update the `register()` implementation to register the `PetEditorProvider`
  - Change the return value of `getRootComponentSelector()` to `pet-root`

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PetEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "angular-extension.petEditor";

    constructor(context: vscode.ExtensionContext) {
      super(context);
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PetEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PetEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    getRootComponentSelector(): string {
      return "pet-root";
    }
  }
  ```

- Update _angular-extension/src/extension.ts_

  - Register the `PetEditorProvider`

  ```typescript
  // The module 'vscode' contains the Visual Studio Code extensibility API
  // Import the module and reference it with the alias vscode in your code below
  import * as vscode from "vscode";
  import { PersonEditorProvider } from "./personEditor";
  import { PetEditorProvider } from "./petEditor";

  // This method is called when your extension is activated
  export function activate(context: vscode.ExtensionContext) {
    // Register our custom editor provider
    context.subscriptions.push(PersonEditorProvider.register(context));
    context.subscriptions.push(PetEditorProvider.register(context));
  }

  // This method is called when your extension is deactivated
  export function deactivate() {}
  ```

Now that the extension code is prepared for multiple custom editors, the webview needs to be implemented in the Angular _webview-ui_ structure. There is also some refactoring involved

- Update _angular-extension/webview-ui/src/app/vscode-textfield-input.directive.ts_  
  I want to use the [VSCode Elements - Single Select](https://vscode-elements.github.io/components/single-select/) component in the new pet editor. The VSCode Elements implementation is based on the Lit library. So the usage requires the implementation of a [ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor) as a [Directive](https://angular.dev/guide/directives/directive-composition-api), which is described in [Getting Started with Visual Studio Code Extension Development](vscode_extension_webview_getting_started.md#vscode-elements-1).
  As the `vscode-single-select` component also tracks its state in the `value` attribute, we can simply add `vscode-single-select` to the `selector` of the existing `Directive`.

  ```typescript
  @Directive({
    selector: 'vscode-textfield, vscode-single-select',
    providers: [VSCODE_TEXTFIELD_INPUT_VALUE_ACCESSOR],
  })
  export class VscodeTextfieldInputDirective implements ControlValueAccessor {
  ```

  We could of course also think about renaming it to something more general, but let's keep the modifications minimal at this point.

- Create a new folder _angular-extension/webview-ui/src/app/person_
- Move the following files to _angular-extension/webview-ui/src/app/person_
  - _angular-extension/webview-ui/src/app/app.component.html_
  - _angular-extension/webview-ui/src/app/app.component.ts_
  - _angular-extension/webview-ui/src/app/app.component.spec.ts_
- Rename those files by replacing _app_ with _person_
- Edit the file _angular-extension/webview-ui/src/app/person/person.component.ts_
  - Change the selector to `person-root`
  - Rename the `AppComponent` class to `PersonComponent`
  - Correct the references in `templateUrl` and `styleUrl`
  ```typescript
  @Component({
    selector: 'person-root',
    imports: [ReactiveFormsModule, VscodeTextfieldInputDirective],
    templateUrl: './person.component.html',
    styleUrl: '../app.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  })
  export class PersonComponent {
  ```

Now create a `PetComponent` as the second custom editor in the Angular extension:

- Create a new folder _angular-extension/webview-ui/src/app/pet_
- Create a new file _angular-extension/webview-ui/src/app/pet/pet.component.html_

  ```typescript
  <main class="main">
    <h1>Angular Pet Editor</h1>
    <div class="content">
      <div class="pet">
        <div class="row">
          <vscode-label for="name">Name:</vscode-label>
          <div class="value">
            <vscode-textfield
              type="text"
              [formControl]="name"
              (input)="updateDocument()"
            />
          </div>
        </div>
        <div class="row">
          <vscode-label for="species">Species:</vscode-label>
          <div class="value">
            <vscode-single-select
              [formControl]="species"
              (input)="updateDocument()"
            >
              <vscode-option>-</vscode-option>
              <vscode-option description="bird">Bird</vscode-option>
              <vscode-option description="cat">Cat</vscode-option>
              <vscode-option description="dog">Dog</vscode-option>
            </vscode-single-select>
          </div>
        </div>
      </div>
    </div>
  </main>
  ```

- Create a new file _angular-extension/webview-ui/src/app/pet/pet.component.ts_  
  The content of this file is almost the same as _angular-extension/webview-ui/src/app/person/person.component.ts_, but of course with changes related to the pet data structure and the selector is changed to `pet-root`.

  ```typescript
  import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    HostListener,
  } from "@angular/core";
  import { FormControl, ReactiveFormsModule } from "@angular/forms";
  import { vscode } from "../utilities/vscode";
  import { VscodeTextfieldInputDirective } from "../vscode-textfield-input.directive";
  import "../../../node_modules/@vscode-elements/elements/dist/vscode-label";
  import "../../../node_modules/@vscode-elements/elements/dist/vscode-textfield";
  import "../../../node_modules/@vscode-elements/elements/dist/vscode-single-select";
  import "../../../node_modules/@vscode-elements/elements/dist/vscode-option";

  @Component({
    selector: "pet-root",
    imports: [ReactiveFormsModule, VscodeTextfieldInputDirective],
    templateUrl: "./pet.component.html",
    styleUrl: "../app.component.css",
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  })
  export class PetComponent {
    name = new FormControl("");
    species = new FormControl("");
    petObject: any;

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
        this.petObject = JSON.parse(text);
        this.name.setValue(this.petObject.name);
        this.species.setValue(this.petObject.species);
      }
    }

    /**
     * Update the document in the extension.
     */
    updateDocument() {
      let name = this.name.value;
      let species = this.species.value;

      // wait 500 ms before updating the document
      // only update if in the meantime no other input was given
      setTimeout(() => {
        if (this.name.value === name && this.species.value === species) {
          this.petObject = {
            name: this.name.value,
            species: this.species.value,
          };

          vscode.postMessage({
            type: "updateDocument",
            text: JSON.stringify(this.petObject, null, 2),
          });
        }
      }, 500);
    }
  }
  ```

- Update the file _angular-extension/webview-ui/src/main.ts_

  - Decide which component to use for bootstrapping based on the `data-root` attribute.  
    This is actually the crucial step if you want to provide multiple webviews in one extension when you use Angular. The bootstrapping of the standalone component needs to be dynamic, and this is implemented by inspecting an attribute added to the webview html in the extension code.

  ```typescript
  import { bootstrapApplication } from "@angular/platform-browser";
  import { appConfig } from "./app/app.config";
  import { PersonComponent } from "./app/person/person.component";
  import { PetComponent } from "./app/pet/pet.component";

  const currentPath = document.documentElement.getAttribute("data-root");
  if (currentPath === "person-root") {
    bootstrapApplication(PersonComponent, appConfig).catch((err) =>
      console.error(err)
    );
  } else if (currentPath === "pet-root") {
    bootstrapApplication(PetComponent, appConfig).catch((err) =>
      console.error(err)
    );
  }
  ```

To verify that it works

- Launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _Angular Pet Editor_

This should open the webview with the content of the Angular `PetComponent`.

## React Webview Implementation

To provide multiple webviews in an extension that uses React as webframework, we need to perform similar steps like before with Angular as webframework.

- Open the _react-extension/package.json_

  - Extend the `contributes` section to add a Pet editor for the **.pet** file extension:

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
        ],
        "priority": "option"
      },
      {
        "viewType": "react-extension.petEditor",
        "displayName": "React Pet Editor",
        "selector": [
          {
            "filenamePattern": "*.pet"
          }
        ],
        "priority": "option"
      }
    ]
  },
  ```

- Create a new file _react-extension/src/abstractEditor.ts_  
  To avoid that we need to copy a lot of code for the new editor, we create an abstract base class `AbstractEditorProvider` that will be used by both editor implementations.

  - Copy the content of _react-extension/src/personEditor.ts_ to _react-extension/src/abstractEditor.ts_
  - Rename `PersonEditorProvider` to `AbstractEditorProvider` and make it `abstract`
  - Remove the `viewType` constant and the `register` method
  - Add an abstract method `getRootComponentSelector()`
  - Update `getWebviewHtml()` to use `getRootComponentSelector()` as an attribute `data-root` in the `html` tag

  ```typescript
  import * as vscode from "vscode";

  export abstract class AbstractEditorProvider
    implements vscode.CustomTextEditorProvider
  {
    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
      document: vscode.TextDocument,
      webviewPanel: vscode.WebviewPanel,
      _token: vscode.CancellationToken
    ): Promise<void> {
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

      webviewPanel.webview.html = this.getWebviewHtml(webviewPanel.webview);

      // Hook up event handlers so that we can synchronize the webview with the text document.
      //
      // The text document acts as our model, so we have to sync change in the document to our
      // editor and sync changes in the editor back to the document.
      //
      // Remember that a single text document can also be shared between multiple custom
      // editors (this happens for example when you split a custom editor)

      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            this.updateWebview(webviewPanel, document);
          }
        });

      // Make sure we get rid of the listener when our editor is closed.
      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });

      // Receive message from the webview.
      webviewPanel.webview.onDidReceiveMessage((e) => {
        switch (e.type) {
          case "updateDocument":
            this.updateDocument(document, e.text);
            return;
        }
      });

      this.updateWebview(webviewPanel, document);
    }

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

      const rootSelector = this.getRootComponentSelector();
      const nonce = this.getNonce();

      // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
      return /*html*/ `
      <!DOCTYPE html>
      <html lang="en" data-root="${rootSelector}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src ${webview.cspSource}; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
    }

    /**
     * Return the selector of the root component to use.
     */
    abstract getRootComponentSelector(): string;

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
  }
  ```

- Update the file _react-extension/src/personEditor.ts_

  - Extend `AbstractEditorProvider`
  - Call `super(context)` in the `constructor`
  - Add the `getRootComponentSelector()` method which returns `person-root`
  - Delete the other methods that are now defined in `AbstractEditorProvider`

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PersonEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "react-extension.personEditor";

    constructor(context: vscode.ExtensionContext) {
      super(context);
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PersonEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PersonEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    getRootComponentSelector(): string {
      return "person-root";
    }
  }
  ```

- Create a new file _react-extension/src/petEditor.ts_

  - Copy the content of _react-extension/src/personEditor.ts_
  - Rename the class to `PetEditorProvider`
  - Update the value of `viewType` to `"react-extension.petEditor"`
  - Update the `register()` implementation to register the `PetEditorProvider`
  - Change the return value of `getRootComponentSelector()` to `pet-root`

  ```typescript
  import * as vscode from "vscode";
  import { AbstractEditorProvider } from "./abstractEditor";

  export class PetEditorProvider extends AbstractEditorProvider {
    private static readonly viewType = "react-extension.petEditor";

    constructor(context: vscode.ExtensionContext) {
      super(context);
    }

    public static register(
      context: vscode.ExtensionContext
    ): vscode.Disposable {
      const provider = new PetEditorProvider(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(
        PetEditorProvider.viewType,
        provider
      );
      return providerRegistration;
    }

    getRootComponentSelector(): string {
      return "pet-root";
    }
  }
  ```

- Update _react-extension/src/extension.ts_

  - Register the `PetEditorProvider`

  ```typescript
  // The module 'vscode' contains the Visual Studio Code extensibility API
  // Import the module and reference it with the alias vscode in your code below
  import * as vscode from "vscode";
  import { PersonEditorProvider } from "./personEditor";
  import { PetEditorProvider } from "./petEditor";

  // This method is called when your extension is activated
  export function activate(context: vscode.ExtensionContext) {
    // Register our custom editor provider
    context.subscriptions.push(PersonEditorProvider.register(context));
    context.subscriptions.push(PetEditorProvider.register(context));
  }

  // This method is called when your extension is deactivated
  export function deactivate() {}
  ```

Now that the extension code is prepared for multiple custom editors, the webview needs to be implemented in the React webview-ui structure.

- Update _react-extension/src/webview-ui/src/global.d.ts_ and add the `VscodeSingleSelect` and the `VscodeOption` web component.  
  To use custom tag names, you must configure the TypeScript parser to recognize the custom elements. This can be done via a TypeScript definition which is described in [Getting Started with Visual Studio Code Extension Development](vscode_extension_webview_getting_started.md#vscode-elements-2).

  ```typescript
  import {
    VscodeLabel,
    VscodeTextfield,
    VscodeSingleSelect,
    VscodeOption,
  } from "@vscode-elements/elements";

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
        "vscode-single-select": WebComponentProps<VscodeSingleSelect>;
        "vscode-option": WebComponentProps<VscodeOption>;
      }
    }
  }
  ```

- Rename _react-extension/src/webview-ui/src/App.tsx_ to _react-extension/src/webview-ui/src/Person.tsx_
- In _react-extension/src/webview-ui/src/Person.tsx_ rename the `App` function to `Person`
- Create a new file _react-extension/src/webview-ui/src/Pet.tsx_
- Copy the content of _react-extension/src/webview-ui/src/Person.tsx_ to the new file and adapt the code to handle a pet instead of a person

  ```typescript
  import { useState } from "react";
  import { vscode } from "./utilities/vscode";
  import "./App.css";
  import "@vscode-elements/elements/dist/vscode-label";
  import "@vscode-elements/elements/dist/vscode-textfield";
  import "@vscode-elements/elements/dist/vscode-single-select";
  import "@vscode-elements/elements/dist/vscode-option";

  function Pet() {
    const [petObject, setPetObject] = useState(loadState);

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
        name: "",
        species: "",
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
        setPetObject({
          name: parsed.name,
          species: parsed.species,
        });
      }
    }

    /**
     * Update the document in the extension.
     */
    function updateDocument() {
      vscode.postMessage({
        type: "updateDocument",
        text: JSON.stringify(petObject, null, 2),
      });
    }

    return (
      <>
        <main className="main">
          <h1>React Pet Editor</h1>
          <div className="content">
            <div className="pet">
              <div className="row">
                <vscode-label htmlFor="name" className="vscode-label">
                  Name:
                </vscode-label>
                <div className="value">
                  <vscode-textfield
                    type="text"
                    id="name"
                    className="vscode-textfield"
                    value={petObject.name}
                    onInput={(event) => {
                      const value = event.currentTarget.value;
                      const target = event.currentTarget;
                      // wait 500 ms before updating the document
                      // only update if in the meantime no other input was given
                      setTimeout(() => {
                        if (value === target.value) {
                          petObject.name = value;
                          updateDocument();
                        }
                      }, 500);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <vscode-label htmlFor="species" className="vscode-label">
                  Species:
                </vscode-label>
                <div className="value">
                  <vscode-single-select
                    id="species"
                    value={petObject.species}
                    onInput={(event) => {
                      const value = event.currentTarget.value;
                      const target = event.currentTarget;
                      // wait 500 ms before updating the document
                      // only update if in the meantime no other input was given
                      setTimeout(() => {
                        if (value === target.value) {
                          petObject.species = value;
                          updateDocument();
                        }
                      }, 500);
                    }}
                  >
                    <vscode-option>-</vscode-option>
                    <vscode-option description="bird">Bird</vscode-option>
                    <vscode-option description="cat">Cat</vscode-option>
                    <vscode-option description="dog">Dog</vscode-option>
                  </vscode-single-select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  export default Pet;
  ```

- Update _react-extension/src/webview-ui/src/main.tsx_

  - Decide which component to use as root based on the `data-root` attribute  
    This is actually the crucial step if you want to provide multiple webviews in one extension when you use React. The definition of the root component needs to be dynamic, and this is implemented by inspecting an attribute added to the webview html in the extension code.

  ```typescript
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import "./index.css";
  import Person from "./Person.tsx";
  import Pet from "./Pet.tsx";

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RootComponent />
    </StrictMode>
  );

  // eslint-disable-next-line react-refresh/only-export-components
  function RootComponent() {
    const currentPath = document.documentElement.getAttribute("data-root");
    if (currentPath === "person-root") {
      return <Person />;
    } else if (currentPath === "pet-root") {
      return <Pet />;
    }
  }
  ```

To verify that it works

- Launch the Visual Studio Code Extension(s)
  - Open _Run and Debug_
  - Ensure _Run Extension_ is selected in the dropdown
  - Click _Start Debugging_ or press _F5_
- Right click on the file created in the previous example in the _Explorer_
- Select _Open With..._ - _React Pet Editor_

This should open the webview with the content of the React `Pet` component.

## Bonus: Automatic Termination of Watch Tasks

In the setup of this project multiple **watch** tasks are started when you launch the Visual Studio Code Extensions for debugging via _Run and Debug_ or by pressing F5 or F11.
I configured the **watch** tasks as `defaultBuildTask` to get code changes directly reflected in the running instance.
This is similar to the **Hot Code Replace** debugging technique in Java.
After a code change in a webview implementation, the changes can be directly seen by either closing and reopening the webview, or by reloading the webview by pressing F1 - _Developer: Reload Webviews_. To reload the **Extension Development Host** after changes in the extension code, you can either click on the debug restart action or press `Ctrl + R` / `Cmd + R` in the **Extension Development Host** window. This makes the development flow a bit more comfortable compared to always having to close and restart the debugging launch configuration.

There is a nasty side effect with this setup. If you close the **Extension Development Host**, the watch tasks are not automatically stopped.
So if you want to start a new debugging session afterwards, nothing happens, because the watch scripts are still running and therefore the patterns that are used to match the started state are not matched in a new start. To make the start of a debug instance work again, you first need to stop the running watch tasks, so they are started freshly. As this is quite annoying when it happens often that you kill the **Extension Development Host** instead of reloading it, I was searching for a solution. A colleague of mine found a nice solution for this, and I modified it to be even more convenient. Of course I found the necessary information in the web, but you know, the blog posts are my external memory.

To automatically terminate the watch tasks

- Open the file _.vscode/tasks.json_
  - Add the following `Terminate Tasks` to the `tasks` and the `terminate` input to the `inputs`
  ```json
  {
    "version": "2.0.0",
    "tasks": [
      ...
      {
        "label": "Terminate Tasks",
        "command": "echo ${input:terminate}",
        "type": "shell",
        "problemMatcher": [],
        "presentation": {
          "reveal": "never",
          "close": true
        }
      },
    ],
    "inputs": [
      {
        "id": "terminate",
        "type": "command",
        "command": "workbench.action.tasks.terminate",
        "args": "terminateAll"
      }
    ]
  }
  ```

The above `Terminate Tasks` configuration triggers the `workbench.action.tasks.terminate` command with the argument `terminateAll`.
So actually this kills all running tasks.
Via the `close` property of the `presentation` task property, we configure that the terminal the tasks runs in is closed the task exits.
This way our Terminal list stays clean.

- Open the file _.vscode/launch.json_
  - Add `"postDebugTask": "Terminate Tasks"` to the `Run Extension` configuration
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
          "${workspaceFolder}/react-extension/dist/**/*.js"
        ],
        "preLaunchTask": "${defaultBuildTask}",
        "postDebugTask": "Terminate Tasks"
      },
      ...
    ]
  }
  ```

If you now start the debugging instance via the `Run Extension` launch configuration, you will again see that the three watch scripts are started before the **Extension Development Host** comes up. If you now stop the **Extension Development Host**, the watch scripts will be stopped also.

_**Note:**_
This will also affect the restart behavior of the **Extension Development Host**. Without the `postDebugTask` the **Extension Development Host** will restart while the watch tasks keep running. With the `postDebugTask` the watch tasks will be killed and also restarted. If you are working on the extension sources and need to restart the **Extension Development Host** to make the changes visible, it might be annoying that the watch scripts are killed and restarted. But if you are working on the webview sources and don't need to restart the **Extension Development Host**, this change might not really be noticable.

## Conclusion

With a Vanilla Javascript and HTML webview, it is straight forward to provide multiple webviews in one extension. The webview HTML is provided by each custom editor provider implementation. And the special handling in the Javascript needs to be implemented accordingly.

Using a webframework like Angular or React the crucial fact is to determine the root component dynamically. If you know how this can be done, it is quite easy, but finding out how to achieve this was indeed a journey.

If you are annoyed by watch scripts that keep running after closing the **Extension Development Host**, the `postDebugTask` of a launch configuration could be helpful. But there are also use cases where the behavior that is introduced by the `postDebugTask` could be annoying, e.g. on restarting the **Extension Development Host**. So you need to use that configuration based on your use cases and personal development/testing preferences.

The sources for this and the following tutorials are located in my [Github repository](https://github.com/fipro78/vscode_theia_cookbook).
