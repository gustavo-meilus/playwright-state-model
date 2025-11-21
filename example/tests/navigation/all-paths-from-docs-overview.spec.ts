import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 9

test.describe("All Navigation Paths from Docs Overview State", () => {
  test("should navigate to getting started from docs overview", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Path 1: docs.overview → docs.gettingStarted
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();
  });

  test("should navigate to API from docs overview", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Path 2: docs.overview → api
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });

  test("should navigate to home from docs overview", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Path 3: docs.overview → home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });

  test("should navigate through all paths from docs overview", async ({
    page,
  }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.dispatch("NAVIGATE_TO_DOCS");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toEqual({ docs: "overview" });

    // Path 1: docs.overview → docs.gettingStarted
    await executor.dispatch("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" });
    await executor.validateCurrentState();

    // Navigate back to docs overview
    await executor.dispatch("NAVIGATE_TO_OVERVIEW");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Path 2: docs.overview → api
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();

    // Navigate back to docs overview
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Path 3: docs.overview → home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();
  });
});

