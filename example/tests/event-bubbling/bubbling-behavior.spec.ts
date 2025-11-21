import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 12

test.describe("Event Bubbling Behavior", () => {
  test("event bubbles from child to parent state", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    // Dispatch NAVIGATE_TO_HOME event (defined in parent 'docs' state, not in child)
    // This should bubble up to parent state handler
    await executor.dispatch("NAVIGATE_TO_HOME");

    // Verify event bubbles up to parent state handler
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });
});

