import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 10

test.describe("All Navigation Paths from Getting Started State", () => {
  test("should navigate to overview from getting started", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Path 1: docs.gettingStarted → docs.overview
    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();
  });

  test("should navigate to home from getting started", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Path 2: docs.gettingStarted → home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });

  test("should navigate through all paths from getting started", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });

    // Path 1: docs.gettingStarted → docs.overview
    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Navigate back to getting started
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    // Path 2: docs.gettingStarted → home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });
});

