import * as vscode from "vscode";

interface IJokeFileParameters {
  path: string;
  filename: string;
  joke: string;
}

export class JokeFileCreatorTool
  implements vscode.LanguageModelTool<IJokeFileParameters>
{
  prepareInvocation?(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IJokeFileParameters>,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PreparedToolInvocation> {
    const confirmationMessages = {
      title: "Create a joke file",
      message: new vscode.MarkdownString(
        options.input.path !== undefined
          ? `Create a joke file in ${options.input.path}?`
          : "Create a joke file?"
      ),
    };

    return {
      invocationMessage: "Create a joke file",
      confirmationMessages,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IJokeFileParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult | null | undefined> {
    const params = options.input;
    const result = await this.createJokeFile(
      params.path,
      params.filename,
      params.joke
    );
    if (result.length > 0) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(result),
      ]);
    } else {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Joke file creation failed`),
      ]);
    }
  }

  public async createJokeFile(
    path: string,
    filename: string,
    jokeContent: string
  ): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return "";
    }

    let folder = workspaceFolders[0];
    let pathUri = vscode.Uri.joinPath(folder.uri, path);

    try {
      await vscode.workspace.fs.stat(pathUri);
    } catch {
      vscode.workspace.fs.createDirectory(pathUri);
    }

    const fileUri = vscode.Uri.joinPath(pathUri, filename);

    try {
      await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(jokeContent, "utf8")
      );
      return `Joke file "${fileUri}" created!`;
    } catch (error) {
      return `Failed to create joke file: ${error}`;
    }
  }
}
