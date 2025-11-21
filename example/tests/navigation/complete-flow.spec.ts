import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 1

test.describe("Complete Navigation Flow", () => {
  test("should navigate through all states", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    // Navigate to initial state
    await page.goto("https://playwright.dev");

    // Validate initial state
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Navigate: home → docs.overview
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Navigate: docs.overview → docs.gettingStarted
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    // Navigate: docs.gettingStarted → docs.overview
    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Navigate: docs.overview → api
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();

    // Navigate: api → home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });
});

