// The module 'vscode' contains the Visual Studio Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { PersonEditorProvider } from "./personEditor";
import { PetEditorProvider } from "./petEditor";

class PetCodeLensProvider implements vscode.CodeLensProvider {
  private document: vscode.TextDocument | undefined;

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    // Store document reference for use in resolveCodeLens
    this.document = document;

    // Get the document text
    const documentText = document.getText();

    // Find the first occurrence of "species" field in the JSON document
    const speciesMatch = documentText.match(/"species"\s*:/);

    if (speciesMatch && speciesMatch.index !== undefined) {
      // Calculate the line and character position of the species field
      const position = document.positionAt(speciesMatch.index);
      const range = new vscode.Range(position, position);

      // Create CodeLens without command - will be resolved later
      let speciesCodeLens = new vscode.CodeLens(range);
      codeLenses.push(speciesCodeLens);
    }

    return codeLenses;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.CodeLens | Thenable<vscode.CodeLens> {
    if (!this.document) {
      return codeLens;
    }

    // Get the document text and parse it as JSON
    const documentText = this.document.getText();

    try {
      const json = JSON.parse(documentText);
      const speciesValue = json.species || "unknown";

      // Create command with species value as argument
      codeLens.command = {
        command: "vscode-extension.makeSpeciesNoise",
        title: `Make Noise for ${speciesValue}`,
        arguments: [speciesValue],
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      codeLens.command = {
        command: "vscode-extension.makeSpeciesNoise",
        title: "Make Noise (Invalid JSON)",
        arguments: ["unknown"],
      };
    }

    return codeLens;
  }
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register our custom editor provider
  context.subscriptions.push(PersonEditorProvider.register(context));
  context.subscriptions.push(PetEditorProvider.register(context));

  // Register the makeSpeciesNoise command with species argument
  let makeSpeciesNoiseCommand = vscode.commands.registerCommand(
    "vscode-extension.makeSpeciesNoise",
    (species: string) => {
      const animalEmojis: { [key: string]: string } = {
        bird: "🐦",
        cat: "🐱",
        dog: "🐶",
        unknown: "🔊",
      };

      const emoji = animalEmojis[species.toLowerCase()] || "🔊";
      const sound =
        species.toLowerCase() === "bird"
          ? "Tweet!"
          : species.toLowerCase() === "cat"
          ? "Meow!"
          : species.toLowerCase() === "dog"
          ? "Woof!"
          : "Noise!";

      vscode.window.showInformationMessage(
        `${emoji} ${sound} Making noise for ${species}! 📢`
      );
    }
  );
  context.subscriptions.push(makeSpeciesNoiseCommand);

  // Get a document selector for the CodeLens provider
  // This one is any file that has the language of pet
  let docSelector = {
    pattern: "**/*.pet",
  };

  // Register our CodeLens provider
  let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    docSelector,
    new PetCodeLensProvider()
  );
  context.subscriptions.push(codeLensProviderDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
