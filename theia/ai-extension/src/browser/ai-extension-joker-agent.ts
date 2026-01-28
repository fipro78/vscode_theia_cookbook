import {
  AbstractStreamParsingChatAgent,
  ChatAgentService,
  MarkdownChatResponseContentImpl,
  MutableChatRequestModel,
  QuestionResponseContentImpl,
} from "@theia/ai-chat";
import {
  BasePromptFragment,
  getTextOfResponse,
  LanguageModelRequirement,
  LanguageModelResponse,
} from "@theia/ai-core";
import { CREATE_JOKE_FILE_FUNCTION_ID } from "./ai-extension-contribution";
import { inject, injectable } from "@theia/core/shared/inversify";

export const jokerTemplate: BasePromptFragment = {
  id: "joker-system-default",
  template: `
  # Instructions

  You are the Joker, the arch enemy of Batman.
  To attack Batman, you tell a joke that is so funny, it distracts him from his mission.
  To keep the distraction going on, write the joke to a file. Use **~{${CREATE_JOKE_FILE_FUNCTION_ID}}** to write the joke to a file.
  If the user does not provide a path, create a new folder "bat-jokes" in the current workspace folder and store the file in that folder.
  Choose a filename that is related to the joke itself.
  `,
};

export const jokerTemplateSimple: BasePromptFragment = {
  id: "joker-system-simple",
  template: `
  # Instructions

  You are the Joker, the arch enemy of Batman.
  To attack Batman, you tell a joke that is so funny, it distracts him from his mission.
  `,
};

@injectable()
export class JokerChatAgent extends AbstractStreamParsingChatAgent {
  id: string = "Joker";
  name: string = "Joker";
  languageModelRequirements: LanguageModelRequirement[] = [
    {
      purpose: "chat",
      identifier: "default/universal",
    },
  ];
  protected defaultLanguageModelPurpose: string = "chat";
  override description = "This agent creates a file with a joke about batman.";

  override iconClass: string = "codicon codicon-feedback";
  protected override systemPromptId: string = "joker-system";
  override prompts = [
    {
      id: "joker-system",
      defaultVariant: jokerTemplate,
      variants: [jokerTemplate, jokerTemplateSimple],
    },
  ];
  override functions = [CREATE_JOKE_FILE_FUNCTION_ID];

  @inject(ChatAgentService)
  protected chatAgentService: ChatAgentService;

  protected override async addContentsToResponse(
    response: LanguageModelResponse,
    request: MutableChatRequestModel,
  ): Promise<void> {
    await super.addContentsToResponse(response, request);

    const selectedVariantId = this.promptService.getSelectedVariantId(
      this.systemPromptId,
    );

    if (selectedVariantId === "joker-system-simple") {
      // if the simple variant is selected, ask if the user wants to delegate to the Writer agent
      request.response.response.addContent(
        new QuestionResponseContentImpl(
          `I have created a funny joke for you. Would you like me to save it to a file using the Writer agent?`,
          [
            { text: "Yes", value: "yes" },
            { text: "No", value: "no" },
          ],
          request,
          async (selectedOption) => {
            if (selectedOption.value === "yes") {
              // get the response text and add it to the request for the Writer agent
              const responseText = await getTextOfResponse(response);
              request.addData("content", responseText);
              request.addData("folder", "bat-jokes");

              // delegate to the Writer agent to save the joke to a file
              const agent = this.chatAgentService.getAgent("Writer");
              if (!agent) {
                throw new Error(`Chat agent "Writer" not found.`);
              }

              await agent.invoke(request);
            } else {
              // don't save to file, just add a funny closing remark
              request.response.response.addContent(
                new MarkdownChatResponseContentImpl(
                  `Hilarious, **Batman** :bat: will never recover from this :dizzy_face: as he will always try to remember my _distracting jokes_!`,
                ),
              );
            }
          },
        ),
      );
    }
  }
}
