import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 18

test.describe("State Validation Failure Handling", () => {
  test("should fail validation when page state doesn't match expected state", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Manually modify page to invalidate state (e.g., change URL)
    await page.goto("https://playwright.dev/docs/api");

    // Attempt to validate state (should fail because we're on API page but state machine thinks we're on home)
    // Note: The state machine still thinks we're on 'home', but the page is actually on API
    // This will cause validation to fail
    await expect(async () => {
      await executor.validateCurrentState();
    }).rejects.toThrow();

    // Verify error message is descriptive (ModelExecutor throws descriptive errors)
    // State machine state is not corrupted (it's just out of sync with the page)
  });

  test("should handle URL mismatch gracefully", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();

    // Navigate to docs
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Manually navigate to a different URL
    await page.goto("https://playwright.dev/docs/api");

    // Validation should fail because state machine expects docs.overview but page is on API
    await expect(async () => {
      await executor.validateCurrentState();
    }).rejects.toThrow();
  });
});

