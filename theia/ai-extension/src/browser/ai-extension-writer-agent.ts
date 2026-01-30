import {
  AbstractStreamParsingChatAgent,
  SystemMessageDescription,
} from "@theia/ai-chat";
import {
  AIVariableContext,
  BasePromptFragment,
  LanguageModelRequirement,
} from "@theia/ai-core";
import { injectable } from "@theia/core/shared/inversify";
import { CREATE_JOKE_FILE_FUNCTION_ID } from "./ai-extension-contribution";

export const writerTemplate: BasePromptFragment = {
  id: "writer-system-default",
  template: `
      # Instructions
    
      You are an agent that operates in the current workspace of the Theia IDE. 
      You are able to persist the provided content into a file by using ~{${CREATE_JOKE_FILE_FUNCTION_ID}}.
      Derive the filename out of the provided content if no filename is provided.
      The file should be created in the folder {{folder}} in the current workspace.

      The content to persist is as follows:
      {{content}}
      `,
};

@injectable()
export class WriterChatAgent extends AbstractStreamParsingChatAgent {
  id: string = "Writer";
  name: string = "Writer";
  languageModelRequirements: LanguageModelRequirement[] = [
    {
      purpose: "chat",
      identifier: "default/universal",
    },
  ];
  protected defaultLanguageModelPurpose: string = "chat";
  override description =
    "This is an agent that is able to persist content into a file in the workspace.";

  override iconClass: string = "codicon codicon-new-file";
  protected override systemPromptId: string = "writer-system";
  override prompts = [
    { id: "writer-system", defaultVariant: writerTemplate, variants: [] },
  ];
  override functions = [CREATE_JOKE_FILE_FUNCTION_ID];
  override agentSpecificVariables = [
    {
      name: "folder",
      description: "The folder in which the file should be created.",
      usedInPrompt: true,
    },
    {
      name: "content",
      description: "The content to persist into the file.",
      usedInPrompt: true,
    },
  ];

  protected override async getSystemMessageDescription(
    context: AIVariableContext,
  ): Promise<SystemMessageDescription | undefined> {
    // extract data from the context
    let request = (context as any).request;
    let folder = request.getDataByKey(`folder`) as string;
    let content = request.getDataByKey(`content`) as string;

    // provide default values if not set
    if (!folder) {
      folder = "temp";
    }

    if (!content) {
      content = "Lorem ipsum dolor sit amet.";
    }

    const variableValues = {
      folder: folder,
      content: content,
    };

    // get the resolved prompt
    const resolvedPrompt = await this.promptService.getResolvedPromptFragment(
      this.systemPromptId,
      variableValues,
      context,
    );

    // return the system message description
    return resolvedPrompt
      ? SystemMessageDescription.fromResolvedPromptFragment(resolvedPrompt)
      : undefined;
  }
}
