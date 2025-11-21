import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";

/**
 * Seed test that sets up the environment necessary to interact with the application.
 * This test demonstrates the basic pattern for using playwright-state-model:
 * - Creating a StateFactory
 * - Initializing ModelExecutor with machine and factory
 * - Navigating to the application
 * - Validating the initial state
 *
 * This seed test serves as a template for all generated tests and provides
 * a ready-to-use page context for bootstrap execution.
 */
test("seed", async ({ page }) => {
  // Create StateFactory with all Page Object mappings
  const factory = createStateFactory(page);

  // Initialize ModelExecutor with machine, factory, and page
  const executor = new ModelExecutor(page, playwrightDevMachine, factory);

  // Navigate to the application URL
  await page.goto("https://playwright.dev");

  // Validate the initial state matches the XState machine's initial state
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("home");
});

