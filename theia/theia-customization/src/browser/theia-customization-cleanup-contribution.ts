import { injectable } from "inversify";
import {
  FrontendApplicationContribution,
  FrontendApplication,
} from "@theia/core/lib/browser";
import { MaybePromise } from "@theia/core/lib/common/types";
import { Widget } from "@theia/core/lib/browser/widgets";

@injectable()
export class CleanupFrontendContribution
  implements FrontendApplicationContribution
{
  /**
   * Called after the application shell has been attached in case there is no previous workbench layout state.
   * Should return a promise if it runs asynchronously.
   */
  onDidInitializeLayout(app: FrontendApplication): MaybePromise<void> {
    // Remove unused widgets
    app.shell.widgets.forEach((widget: Widget) => {
      if (widget.id.startsWith("terminal")) {
        widget.dispose();
      }
    });
  }
}
