import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 3

test.describe("Hierarchical State Validation", () => {
  test("should validate hierarchical states correctly", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();

    // Navigate to docs (parent state with child overview)
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Validate state hierarchy
    // Both parent (docs) and child (docs.overview) should be validated
    await executor.validateCurrentState();

    // Navigate to getting started (child state)
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Validate nested state hierarchy
    // Both parent (docs) and child (docs.gettingStarted) should be validated
    await executor.validateCurrentState();
  });
});

