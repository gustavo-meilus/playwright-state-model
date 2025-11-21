import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 13

test.describe("Event Bubbling for NAVIGATE_TO_API", () => {
  test("NAVIGATE_TO_API from docs overview (defined in both child and parent)", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Dispatch NAVIGATE_TO_API (defined in both child docs.overview and parent docs)
    // Child handler should take precedence
    await executor.dispatch("NAVIGATE_TO_API");

    // Verify event handling works correctly
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });

  test("NAVIGATE_TO_API from getting started (should bubble to parent)", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Dispatch NAVIGATE_TO_API (should bubble to parent 'docs' state)
    // since it's not defined in docs.gettingStarted
    await executor.dispatch("NAVIGATE_TO_API");

    // Verify state transitions correctly to API
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });

  test("event bubbling works for NAVIGATE_TO_API from both docs states", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Test from docs.overview (has handler in child)
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();

    // Navigate back to docs overview
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Navigate to getting started
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Test from docs.gettingStarted (should bubble to parent)
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });
});

