import { test, expect } from "@playwright/test";
import { createExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { HomePage } from "../../src/pages/HomePage";
import { DocsOverviewPage } from "../../src/pages/DocsPage";
import { GettingStartedPage } from "../../src/pages/GettingStartedPage";
import { ApiPage } from "../../src/pages/ApiPage";

// spec: example/tests/TEST_PLAN.md - Test Scenario 1

test.describe("Complete Navigation Flow", () => {
  test("should navigate through all states", async ({ page }) => {
    // Using bulk registration for cleaner code
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "api": ApiPage,
      });
    });

    // Navigate to initial state
    await page.goto("https://playwright.dev");

    // Validate initial state using convenience method with string comparison
    await executor.expectState("home");
    expect(executor.currentStateString).toBe("home");

    // Navigate: home → docs.overview using convenience method
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState("docs.overview");
    expect(executor.currentStateString).toBe("docs.overview");

    // Navigate: docs.overview → docs.gettingStarted
    await executor.navigateAndValidate("NAVIGATE_TO_GETTING_STARTED");
    await executor.expectState("docs.gettingStarted");
    expect(executor.currentStateString).toBe("docs.gettingStarted");

    // Navigate: docs.gettingStarted → docs.overview
    await executor.navigateAndValidate("NAVIGATE_TO_OVERVIEW");
    await executor.expectState("docs.overview");
    expect(executor.currentStateString).toBe("docs.overview");

    // Navigate: docs.overview → api
    await executor.navigateAndValidate("NAVIGATE_TO_API");
    await executor.expectState("api");
    expect(executor.currentStateString).toBe("api");

    // Navigate: api → home
    await executor.navigateAndValidate("NAVIGATE_TO_HOME");
    await executor.expectState("home");
    expect(executor.currentStateString).toBe("home");
  });
});

