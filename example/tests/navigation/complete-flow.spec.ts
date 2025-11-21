import { test } from "@playwright/test";
import { createExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { HomePage } from "../../src/pages/HomePage";
import { DocsOverviewPage } from "../../src/pages/DocsPage";
import { GettingStartedPage } from "../../src/pages/GettingStartedPage";
import { ApiPage } from "../../src/pages/ApiPage";

// spec: example/tests/TEST_PLAN.md - Test Scenario 1

test.describe("Complete Navigation Flow", () => {
  test("should navigate through all states", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.register("home", HomePage);
      factory.register("docs", DocsOverviewPage);
      factory.register("docs.overview", DocsOverviewPage);
      factory.register("docs.gettingStarted", GettingStartedPage);
      factory.register("api", ApiPage);
    });

    // Navigate to initial state
    await page.goto("https://playwright.dev");

    // Validate initial state using convenience method
    await executor.expectState("home");

    // Navigate: home → docs.overview using convenience method
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });

    // Navigate: docs.overview → docs.gettingStarted
    await executor.navigateAndValidate("NAVIGATE_TO_GETTING_STARTED");
    await executor.expectState({ docs: "gettingStarted" });

    // Navigate: docs.gettingStarted → docs.overview
    await executor.navigateAndValidate("NAVIGATE_TO_OVERVIEW");
    await executor.expectState({ docs: "overview" });

    // Navigate: docs.overview → api
    await executor.navigateAndValidate("NAVIGATE_TO_API");
    await executor.expectState("api");

    // Navigate: api → home
    await executor.navigateAndValidate("NAVIGATE_TO_HOME");
    await executor.expectState("home");
  });
});

