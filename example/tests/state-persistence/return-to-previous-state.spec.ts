import { test } from "@playwright/test";
import { createExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { HomePage } from "../../src/pages/HomePage";
import { DocsOverviewPage } from "../../src/pages/DocsPage";
import { GettingStartedPage } from "../../src/pages/GettingStartedPage";

// spec: example/tests/TEST_PLAN.md - Test Scenario 16

test.describe("Return to Previous State", () => {
  test("should return correctly to previous state", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.register("home", HomePage);
      factory.register("docs", DocsOverviewPage);
      factory.register("docs.overview", DocsOverviewPage);
      factory.register("docs.gettingStarted", GettingStartedPage);
    });

    await page.goto("https://playwright.dev");

    // Navigate forward: home → docs.overview → docs.gettingStarted
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });

    await executor.navigateAndValidate("NAVIGATE_TO_GETTING_STARTED");
    await executor.expectState({ docs: "gettingStarted" });

    // Navigate back: docs.gettingStarted → docs.overview
    await executor.navigateAndValidate("NAVIGATE_TO_OVERVIEW");
    await executor.expectState({ docs: "overview" });

    // Verify page content matches expected state
    // State validation confirms correct page is displayed
    // Network requests are made appropriately (handled by Page Objects)
  });
});

