/**
 * Test helper utilities to reduce code duplication and improve maintainability.
 * Follows DRY (Don't Repeat Yourself) principle.
 */

import { Page, expect } from "@playwright/test";
import { ModelExecutor, ModelExecutorOptions } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";
import { BASE_URL, STATE_VALUES } from "../../src/constants";

/**
 * Creates a configured ModelExecutor instance for testing.
 * Encapsulates common setup logic.
 * 
 * @param page - Playwright Page instance
 * @param options - Optional ModelExecutor configuration options
 */
export function createTestExecutor(page: Page, options?: ModelExecutorOptions): ModelExecutor {
  const factory = createStateFactory(page);
  return new ModelExecutor(page, playwrightDevMachine, factory, options);
}

/**
 * Initializes the test by navigating to the home page and validating initial state.
 * Returns the executor instance for further test operations.
 * 
 * @param page - Playwright Page instance
 * @param options - Optional ModelExecutor configuration options
 */
export async function initializeTest(page: Page, options?: ModelExecutorOptions): Promise<ModelExecutor> {
  const executor = createTestExecutor(page, options);
  await page.goto(BASE_URL);
  await executor.validateCurrentState();
  return executor;
}

/**
 * Initializes the test and asserts the initial state is 'home'.
 * Returns the executor instance for further test operations.
 * Uses currentStateString for string comparison.
 * 
 * @param page - Playwright Page instance
 * @param options - Optional ModelExecutor configuration options
 */
export async function initializeTestFromHome(
  page: Page,
  options?: ModelExecutorOptions
): Promise<ModelExecutor> {
  const executor = await initializeTest(page, options);
  expect(executor.currentStateString).toBe(STATE_VALUES.HOME);
  return executor;
}

// Re-export expect for convenience
export { expect };

