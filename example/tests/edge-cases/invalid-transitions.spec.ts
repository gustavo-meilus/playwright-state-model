import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 17

test.describe("Invalid Event Dispatch Handling", () => {
  test("should handle invalid event dispatch gracefully", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Attempt to dispatch an event not defined for 'home' state
    // (e.g., NAVIGATE_TO_GETTING_STARTED is not available from home)
    // XState will ignore invalid events, so state should remain unchanged
    const initialState = executor.currentStateValue;

    // Try to dispatch an invalid event
    // Note: XState silently ignores events that don't match any transition
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");

    // Verify current state remains unchanged
    expect(executor.currentStateValue).toBe(initialState);
    expect(executor.currentStateValue).toBe("home");

    // Verify no errors are thrown (or appropriate error handling)
    // State machine handles it gracefully

    // Validate state still valid
    await executor.validateCurrentState();
  });

  test("should handle non-existent event gracefully", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    const initialState = executor.currentStateValue;

    // Try to dispatch a completely non-existent event
    // XState will ignore this
    await executor.dispatch("NON_EXISTENT_EVENT" as any);

    // Verify state remains unchanged
    expect(executor.currentStateValue).toBe(initialState);
    expect(executor.currentStateValue).toBe("home");

    // State should still be valid
    await executor.validateCurrentState();
  });
});

