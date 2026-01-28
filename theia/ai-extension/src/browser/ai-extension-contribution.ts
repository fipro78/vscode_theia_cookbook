import { MutableChatRequestModel } from "@theia/ai-chat";
import { ToolProvider, ToolRequest } from "@theia/ai-core";
import { BinaryBuffer } from "@theia/core/lib/common/buffer";
import { inject, injectable } from "@theia/core/shared/inversify";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { FileNavigatorCommands } from "@theia/navigator/lib/browser/navigator-contribution";
import { CommandRegistry, MessageService } from "@theia/core";
import { FrontendApplicationContribution } from "@theia/core/lib/browser";
import { EnvVariablesServer } from "@theia/core/lib/common/env-variables";
import {
  LocalMCPServerDescription,
  MCPFrontendService,
  RemoteMCPServerDescription,
} from "@theia/ai-mcp/lib/common";

export const CREATE_JOKE_FILE_FUNCTION_ID = "jokeFileCreator";

@injectable()
export class JokeFileCreationFunction implements ToolProvider {
  static ID = CREATE_JOKE_FILE_FUNCTION_ID;

  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(CommandRegistry)
  protected commandRegistry: CommandRegistry;

  getTool(): ToolRequest {
    return {
      id: JokeFileCreationFunction.ID,
      name: JokeFileCreationFunction.ID,
      description: `Create a file at the given path that contains a joke.`,
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "The name of the folder in the workspace where the joke file should be created.",
          },
          filename: {
            type: "string",
            description: "The name of the jokefile that should be created.",
          },
          joke: {
            type: "string",
            description: "The joke content to be written in the joke file.",
          },
        },
        required: ["path", "filename", "joke"],
      },
      handler: async (
        args: string,
        ctx: MutableChatRequestModel,
      ): Promise<string> => {
        if (ctx?.response?.cancellationToken?.isCancellationRequested) {
          return JSON.stringify({ error: "Operation cancelled by user" });
        }

        const { path, filename, joke } = JSON.parse(args);

        const wsRoots = await this.workspaceService.roots;
        if (wsRoots.length === 0) {
          throw new Error("No workspace has been opened yet");
        }
        const workspaceRoot = wsRoots[0].resource;
        const uri = workspaceRoot.resolve(path);

        try {
          await this.fileService.createFolder(uri);
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }

        const fileUri = uri.resolve(filename);

        // ensure that we do not overwrite existing files
        if (await this.fileService.exists(fileUri)) {
          return JSON.stringify({
            error: `File ${fileUri} already exists`,
          });
        }

        try {
          await this.fileService.createFile(
            fileUri,
            BinaryBuffer.fromString(joke),
          );

          this.commandRegistry.executeCommand(
            FileNavigatorCommands.REFRESH_NAVIGATOR.id,
          );

          return `Successfully wrote a joke in the file ${fileUri}`;
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    };
  }
}

@injectable()
export class McpFrontendContribution implements FrontendApplicationContribution {
  @inject(EnvVariablesServer)
  private readonly envVariablesServer: EnvVariablesServer;

  @inject(MCPFrontendService)
  protected readonly mcpFrontendService: MCPFrontendService;

  @inject(MessageService)
  private readonly messageService: MessageService;

  async onStart(): Promise<void> {
    try {
      // add a local MCP server
      const fileSystemServer: LocalMCPServerDescription = {
        name: "filesystem",
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/home/node/example",
        ],
      };
      this.mcpFrontendService.addOrUpdateServer(fileSystemServer);

      // add a remote MCP server
      const fetchServer: RemoteMCPServerDescription = {
        name: "fetch",
        serverUrl: "https://remote.mcpservers.org/fetch/mcp",
      };
      this.mcpFrontendService.addOrUpdateServer(fetchServer);

      // get the GITHUB_TOKEN environment variable
      const githubTokenVar =
        await this.envVariablesServer.getValue("GITHUB_TOKEN");
      // add a remote MCP server with resolve method
      const githubServer: RemoteMCPServerDescription = {
        name: "github",
        serverUrl: "https://api.githubcopilot.com/mcp/",
        serverAuthToken: githubTokenVar?.value,
        headers: {
          "X-MCP-Toolsets": "gists",
        },
      };
      this.mcpFrontendService.addOrUpdateServer(githubServer);
    } catch (error) {
      console.error("Error configuring MCP server:", error);
      this.messageService.error(
        "Failed to configure MCP server. Please check the console for details.",
      );
    }
  }
}
