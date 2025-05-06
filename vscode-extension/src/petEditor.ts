import * as vscode from "vscode";
import { AbstractEditorProvider } from "./abstractEditor";

export class PetEditorProvider extends AbstractEditorProvider {
  private static readonly viewType = "vscode-extension.petEditor";

  constructor(private readonly context: vscode.ExtensionContext) {
    super();
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
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
