import * as vscode from "vscode";

export class PersonEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = "vscode-extension.personEditor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PersonEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      PersonEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

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
