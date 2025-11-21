import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 15

test.describe("Rapid State Transitions", () => {
  test("should handle rapid sequential transitions", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Perform rapid sequential transitions
    // Each transition should complete before next begins
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();

    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();

    // Verify final state is correct
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();

    // All intermediate states were valid (validated above)
    // No race conditions occurred (each transition completed before next)
  });
});

