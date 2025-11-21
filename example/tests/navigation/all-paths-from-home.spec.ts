import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";

// spec: example/tests/TEST_PLAN.md - Test Scenario 8

test.describe("All Navigation Paths from Home State", () => {
  test("should navigate to docs overview from home", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Path 1: home → docs.overview
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();
  });

  test("should navigate to API from home", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Path 2: home → api
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });

  test("should navigate through all paths from home", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto("https://playwright.dev");
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Path 1: home → docs.overview
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();

    // Navigate back to home
    await executor.dispatch("NAVIGATE_TO_HOME");
    expect(executor.currentStateValue).toBe("home");
    await executor.validateCurrentState();

    // Path 2: home → api
    await executor.dispatch("NAVIGATE_TO_API");
    expect(executor.currentStateValue).toBe("api");
    await executor.validateCurrentState();
  });
});

