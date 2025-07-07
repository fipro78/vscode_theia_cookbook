import {
  FilterContribution,
  ContributionFilterRegistry,
  Filter,
} from "@theia/core/lib/common";
import { injectable } from "@theia/core/shared/inversify";

@injectable()
export class TheiaCustomizationFilterContribution
  implements FilterContribution
{
  registerContributionFilters(registry: ContributionFilterRegistry): void {
    registry.addFilters("*", [
      // Filter out the main outline contribution at:
      // https://github.com/eclipse-theia/theia/blob/master/packages/terminal/src/browser/terminal-frontend-contribution.ts
      filterClassName((name) => name !== "TerminalFrontendContribution"),
    ]);
  }
}

function filterClassName(filter: Filter<string>): Filter<Object> {
  return (object) => {
    const className = object?.constructor?.name;
    return className ? filter(className) : false;
  };
}
