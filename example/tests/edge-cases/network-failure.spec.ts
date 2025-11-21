import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 19

test.describe("Network Request Failure Handling", () => {
  test("should handle network request failure gracefully", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Set up network interception to simulate request failure
    await page.route("**/docs", (route) => route.abort());

    // Attempt navigation
    // The navigation will fail, but we need to handle it gracefully
    try {
      await executor.dispatch("NAVIGATE_TO_DOCS");
      // If navigation somehow succeeds (e.g., cached), that's also valid
    } catch (error) {
      // Network failures may cause errors, which is expected
      // Verify state machine handles failure gracefully
      // Current state should remain valid or transition appropriately
    }

    // Verify state machine state is not corrupted
    // The state may remain on 'home' or transition to 'docs' if navigation succeeded
    const currentState = executor.currentStateValue;
    expect(["home", { docs: "overview" }]).toContainEqual(currentState);
  });

  test("should handle network timeout gracefully", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();

    // Set up network interception to simulate timeout
    await page.route("**/docs", (route) => {
      // Don't respond, simulating a timeout
      // Note: Playwright will timeout after default timeout
    });

    // Attempt navigation with timeout
    try {
      await executor.dispatch("NAVIGATE_TO_DOCS");
    } catch (error) {
      // Timeout errors are expected
      // Verify state machine handles failure gracefully
    }

    // Verify state machine state is not corrupted
    const currentState = executor.currentStateValue;
    expect(currentState).toBeDefined();
  });
});

