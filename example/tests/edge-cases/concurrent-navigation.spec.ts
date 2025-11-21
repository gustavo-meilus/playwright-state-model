import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 20

test.describe("Concurrent Navigation Attempts", () => {
  test("should handle concurrent navigation attempts", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Start navigation to docs
    const nav1 = executor.dispatch("NAVIGATE_TO_DOCS");

    // Immediately attempt navigation to API
    const nav2 = executor.dispatch("NAVIGATE_TO_API");

    // Wait for both promises
    // Note: ModelExecutor should handle concurrent attempts appropriately
    // Only one navigation should complete, or both should resolve in order
    await Promise.all([nav1, nav2]);

    // Verify final state is correct
    // The last dispatched event should determine the final state
    // or the first one to complete
    const finalState = executor.currentStateValue;
    const validStates = ["api", { docs: "overview" }];
    expect(
      validStates.some(
        (state) => JSON.stringify(state) === JSON.stringify(finalState)
      )
    ).toBeTruthy();

    // Verify state machine handled concurrent attempts appropriately
    // No state corruption occurred
    await executor.validateCurrentState();
  });

  test("should handle rapid concurrent dispatches", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();

    // Dispatch multiple events rapidly
    const promises = [
      executor.dispatch("NAVIGATE_TO_DOCS"),
      executor.dispatch("NAVIGATE_TO_API"),
      executor.dispatch("NAVIGATE_TO_HOME"),
    ];

    // Wait for all to complete
    await Promise.all(promises);

    // Verify final state is valid
    const finalState = executor.currentStateValue;
    expect(finalState).toBeDefined();
    expect(["home", "api", { docs: "overview" }]).toContainEqual(finalState);

    // Verify no state corruption
    await executor.validateCurrentState();
  });
});

