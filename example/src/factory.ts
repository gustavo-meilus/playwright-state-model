import { Page } from "@playwright/test";
import { StateFactory } from "playwright-state-model";
import { HomePage } from "./pages/HomePage";
import { DocsOverviewPage } from "./pages/DocsPage";
import { GettingStartedPage } from "./pages/GettingStartedPage";
import { ApiPage } from "./pages/ApiPage";

/**
 * Configures the StateFactory with all Page Object mappings.
 * Uses bulk registration for cleaner code.
 */
export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);

  // Bulk registration - cleaner and more maintainable
  factory.registerStates({
    "home": HomePage,
    "docs": DocsOverviewPage,
    "docs.overview": DocsOverviewPage,
    "docs.gettingStarted": GettingStartedPage,
    "docs.api": ApiPage,
    "api": ApiPage,
  });

  return factory;
}
