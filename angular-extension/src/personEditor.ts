import * as vscode from "vscode";
import { AbstractEditorProvider } from "./abstractEditor";

export class PersonEditorProvider extends AbstractEditorProvider {
  private static readonly viewType = "angular-extension.personEditor";

  constructor(context: vscode.ExtensionContext) {
    super(context);
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
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
