// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { JokeFileCreatorTool } from "./joke-file-creator";
import * as chatUtils from "@vscode/chat-extension-utils";

const JOKER_PROMPT = `You are the Joker, the arch enemy of Batman.
To attack Batman, you tell a joke that is so funny, it distracts him from his mission.
To keep the distraction going on, write the joke to a file.
If the user does not provide a path, create a new folder "bat-jokes" in the current workspace folder and store the file in that folder.`;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "copilot-extension" is now active!'
  );

  // Register our custom joke creator language model tool
  context.subscriptions.push(
    vscode.lm.registerTool("chat-tools-joke", new JokeFileCreatorTool())
  );

  const didChangeEmitter = new vscode.EventEmitter<void>();

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider("custom-mcp", {
      onDidChangeMcpServerDefinitions: didChangeEmitter.event,
      provideMcpServerDefinitions: async () => {
        let servers: vscode.McpServerDefinition[] = [];

        // add the servers
        servers.push(
          new vscode.McpStdioServerDefinition("filesystem", "npx", [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/home/node/example",
          ])
        );

        servers.push(
          new vscode.McpHttpServerDefinition(
            "fetch",
            vscode.Uri.parse("https://remote.mcpservers.org/fetch/mcp")
          )
        );

        servers.push(
          new vscode.McpHttpServerDefinition(
            "github",
            vscode.Uri.parse("https://api.githubcopilot.com/mcp/")
          )
        );

        return servers;
      },
      resolveMcpServerDefinition: async (
        server: vscode.McpServerDefinition
      ) => {
        if (server.label === "github") {
          // First check if token is available in environment variable
          let token = process.env.GITHUB_TOKEN;

          // If no environment variable, ask for token from user
          if (!token) {
            token = await vscode.window.showInputBox({
              prompt: `Enter the authorization token for ${server.label}`,
              password: true,
              placeHolder: `Enter your authorization token for ${server.label} ...`,
            });

            if (token) {
              // If user provided a token, save it to environment variable for future use
              process.env.GITHUB_TOKEN = token;
              console.log(`GITHUB_TOKEN saved to environment for future use`);
            }
          } else {
            console.log(
              `Using GITHUB_TOKEN from environment for ${server.label}`
            );
          }

          if (!token) {
            vscode.window.showErrorMessage(
              `Authorization token is required for ${server.label}`
            );
            return undefined; // Don't start the server without a token
          }

          // Update the server headers with the new token
          const updatedHeaders = {
            ...(server as any).headers,
            Authorization: `Bearer ${token}`,
          };

          (server as any).headers = updatedHeaders;
        }

        // Return undefined to indicate that the server should not be started or throw an error
        // If there is a pending tool call, the editor will cancel it and return an error message
        // to the language model.
        return server;
      },
    })
  );

  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    // Chat request handler implementation goes here
    try {
      const tools = vscode.lm.tools.filter(
        (tool) => tool.name === "chat-tools-joke"
      );

      const libResult = chatUtils.sendChatParticipantRequest(
        request,
        context,
        {
          prompt: JOKER_PROMPT,
          responseStreamOptions: {
            stream,
            references: true,
            responseText: true,
          },
          tools,
        },
        token
      );

      return await libResult.result;
    } catch (err) {
      console.log(`Error in chat request handler: ${err}`);
    }
  };

  const chatLibParticipant = vscode.chat.createChatParticipant(
    "joker-sample.joker-participant",
    handler
  );
  context.subscriptions.push(chatLibParticipant);
}

// This method is called when your extension is deactivated
export function deactivate() {}
