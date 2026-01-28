import {
  McpFrontendContribution,
  JokeFileCreationFunction,
} from "./ai-extension-contribution";
import { Agent, bindToolProvider } from "@theia/ai-core/lib/common";
import { ChatAgent } from "@theia/ai-chat/lib/common";
import { FrontendApplicationContribution } from "@theia/core/lib/browser";
import { ContainerModule } from "@theia/core/shared/inversify";
import { JokerChatAgent } from "./ai-extension-joker-agent";
import { WriterChatAgent } from "./ai-extension-writer-agent";
import { ChatResponsePartRenderer } from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import { NoWaitQuestionPartRenderer } from "./no-wait-question-part-renderer";

export default new ContainerModule((bind) => {
  bindToolProvider(JokeFileCreationFunction, bind);

  bind(McpFrontendContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(McpFrontendContribution);

  bind(JokerChatAgent).toSelf().inSingletonScope();
  bind(Agent).toService(JokerChatAgent);
  bind(ChatAgent).toService(JokerChatAgent);

  bind(WriterChatAgent).toSelf().inSingletonScope();
  bind(Agent).toService(WriterChatAgent);
  bind(ChatAgent).toService(WriterChatAgent);

  bind(ChatResponsePartRenderer)
    .to(NoWaitQuestionPartRenderer)
    .inSingletonScope();
});
