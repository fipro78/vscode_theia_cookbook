import { ChatResponseContent, QuestionResponseContent } from "@theia/ai-chat";
import { injectable } from "@theia/core/shared/inversify";
import * as React from "@theia/core/shared/react";
import { ReactNode } from "@theia/core/shared/react";
import { ChatResponsePartRenderer } from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import { ResponseNode } from "@theia/ai-chat-ui/lib/browser/chat-tree-view";

@injectable()
export class NoWaitQuestionPartRenderer implements ChatResponsePartRenderer<QuestionResponseContent> {
  canHandle(response: ChatResponseContent): number {
    if (QuestionResponseContent.is(response)) {
      return 100;
    }
    return -1;
  }

  render(question: QuestionResponseContent, node: ResponseNode): ReactNode {
    const isDisabled = question.selectedOption !== undefined;

    return (
      <div className="theia-QuestionPartRenderer-root">
        <div className="theia-QuestionPartRenderer-question">
          {question.question}
        </div>
        <div className="theia-QuestionPartRenderer-options">
          {question.options.map((option, index) => (
            <button
              className={`theia-button theia-QuestionPartRenderer-option ${
                question.selectedOption?.text === option.text ? "selected" : ""
              }`}
              onClick={() => {
                if (!question.isReadOnly && question.handler) {
                  question.selectedOption = option;
                  question.handler(option);
                }
              }}
              disabled={isDisabled}
              key={index}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
