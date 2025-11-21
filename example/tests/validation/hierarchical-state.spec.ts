import { test } from "@playwright/test";
import { createExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { HomePage } from "../../src/pages/HomePage";
import { DocsOverviewPage } from "../../src/pages/DocsPage";
import { GettingStartedPage } from "../../src/pages/GettingStartedPage";

// spec: example/tests/TEST_PLAN.md - Test Scenario 3

test.describe("Hierarchical State Validation", () => {
  test("should validate hierarchical states correctly", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.register("home", HomePage);
      factory.register("docs", DocsOverviewPage);
      factory.register("docs.overview", DocsOverviewPage);
      factory.register("docs.gettingStarted", GettingStartedPage);
    });

    await page.goto("https://playwright.dev");
    await executor.expectState("home");

    // Navigate to docs (parent state with child overview)
    // navigateAndValidate automatically validates after transition
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });

    // Navigate to getting started (child state)
    await executor.navigateAndValidate("NAVIGATE_TO_GETTING_STARTED");
    await executor.expectState({ docs: "gettingStarted" });
  });
});

