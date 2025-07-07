import { ContainerModule } from "@theia/core/shared/inversify";
import { TheiaCustomizationContribution } from "./theia-customization-contribution";
import {
  ApplicationShell,
  FrontendApplicationContribution,
} from "@theia/core/lib/browser";
import { TheiaCustomizationFilterContribution } from "./theia-customization-filter-contribution";
import { bindContribution, FilterContribution } from "@theia/core";
import { CleanupFrontendContribution } from "./theia-customization-cleanup-contribution";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(TheiaCustomizationContribution).toSelf().inSingletonScope();
  rebind(ApplicationShell)
    .to(TheiaCustomizationContribution)
    .inSingletonScope();

  bind(TheiaCustomizationFilterContribution).toSelf().inSingletonScope();
  bindContribution(bind, TheiaCustomizationFilterContribution, [
    FilterContribution,
  ]);

  bind(CleanupFrontendContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(CleanupFrontendContribution);
});
