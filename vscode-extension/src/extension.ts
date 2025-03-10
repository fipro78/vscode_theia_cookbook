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
