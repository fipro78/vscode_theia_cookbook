import { ApplicationShell } from "@theia/core/lib/browser";
import { injectable, postConstruct } from "@theia/core/shared/inversify";

import "../../src/browser/style/index.css";

@injectable()
export class TheiaCustomizationContribution extends ApplicationShell {
  @postConstruct()
  protected init(): void {
    super.init();

    const div = document.createElement("div");
    div.id = "example-header";

    const h1 = document.createElement("h1");
    h1.id = "example-app-title";
    const appTitle = document.createTextNode("My Custom Theia Application");
    h1.append(appTitle);
    div.append(h1);

    document.body.prepend(div);
  }
}
