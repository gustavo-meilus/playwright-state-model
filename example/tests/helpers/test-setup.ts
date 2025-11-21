/**
 * Test helper utilities to reduce code duplication and improve maintainability.
 * Follows DRY (Don't Repeat Yourself) principle.
 */

import { Page, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { playwrightDevMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";
import { BASE_URL, STATE_VALUES } from "../../src/constants";

/**
 * Creates a configured ModelExecutor instance for testing.
 * Encapsulates common setup logic.
 */
export function createTestExecutor(page: Page): ModelExecutor {
  const factory = createStateFactory(page);
  return new ModelExecutor(page, playwrightDevMachine, factory);
}

/**
 * Initializes the test by navigating to the home page and validating initial state.
 * Returns the executor instance for further test operations.
 */
export async function initializeTest(page: Page): Promise<ModelExecutor> {
  const executor = createTestExecutor(page);
  await page.goto(BASE_URL);
  await executor.validateCurrentState();
  return executor;
}

/**
 * Initializes the test and asserts the initial state is 'home'.
 * Returns the executor instance for further test operations.
 */
export async function initializeTestFromHome(
  page: Page
): Promise<ModelExecutor> {
  const executor = await initializeTest(page);
  expect(executor.currentStateValue).toBe(STATE_VALUES.HOME);
  return executor;
}

// Re-export expect for convenience
export { expect };

