import * as vscode from "vscode";
import { AbstractEditorProvider } from "./abstractEditor";

export class PetEditorProvider extends AbstractEditorProvider {
  private static readonly viewType = "react-extension.petEditor";

  constructor(context: vscode.ExtensionContext) {
    super(context);
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
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
