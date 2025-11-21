import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 16

test.describe("Return to Previous State", () => {
  test("should return correctly to previous state", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");

    // Navigate forward: home → docs.overview → docs.gettingStarted
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    // Navigate back: docs.gettingStarted → docs.overview
    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Verify page content matches expected state
    // State validation confirms correct page is displayed
    // Network requests are made appropriately (handled by Page Objects)
  });
});

