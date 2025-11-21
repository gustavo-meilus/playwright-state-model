import { test, expect } from '@playwright/test';
import { ModelExecutor } from 'poc-model-state-playwright';
import { playwrightDevMachine } from '../src/machine';
import { createStateFactory } from '../src/factory';

test.describe('Playwright.dev Navigation Model', () => {
  test('should navigate through states using XState model', async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto('https://playwright.dev');

    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe('home');

    await executor.dispatch('NAVIGATE_TO_DOCS');
    expect(executor.currentStateValue).toEqual({ docs: 'overview' });

    await executor.dispatch('NAVIGATE_TO_GETTING_STARTED');
    expect(executor.currentStateValue).toEqual({ docs: 'gettingStarted' });

    await executor.dispatch('NAVIGATE_TO_OVERVIEW');
    expect(executor.currentStateValue).toEqual({ docs: 'overview' });

    await executor.dispatch('NAVIGATE_TO_API');
    expect(executor.currentStateValue).toBe('api');

    await executor.dispatch('NAVIGATE_TO_HOME');
    expect(executor.currentStateValue).toBe('home');
  });

  test('should handle direct navigation to API from home', async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto('https://playwright.dev');

    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe('home');

    await executor.dispatch('NAVIGATE_TO_API');
    expect(executor.currentStateValue).toBe('api');

    await executor.validateCurrentState();
  });

  test('should validate state hierarchy correctly', async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, playwrightDevMachine, factory);

    await page.goto('https://playwright.dev');
    await executor.validateCurrentState();
    
    await executor.dispatch('NAVIGATE_TO_DOCS');
    expect(executor.currentStateValue).toEqual({ docs: 'overview' });
    
    await executor.dispatch('NAVIGATE_TO_GETTING_STARTED');
    
    const stateValue = executor.currentStateValue;
    expect(stateValue).toEqual({ docs: 'gettingStarted' });

    await executor.validateCurrentState();
  });
});
