import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../src/machine";
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
 *
 * Usage:
 * - Include this file in the context when using the planner agent
 * - Use this as a reference pattern for the generator agent
 * - Reference this structure when creating new test plans
 *
 * Note: This is a template seed file. Update the imports and URL to match your project.
 */
test("seed", async ({ page }) => {
  // Create StateFactory with all Page Object mappings
  const factory = createStateFactory(page);

  // Initialize ModelExecutor with machine, factory, and page
  const executor = new ModelExecutor(page, appMachine, factory);

  // Navigate to the application URL
  // Update this URL to match your target application
  await page.goto("https://example.com");

  // Validate the initial state matches the XState machine's initial state
  // Update the expected state value to match your machine's initial state
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("home");
});

