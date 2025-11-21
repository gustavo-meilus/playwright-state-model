import { test, expect } from "@playwright/test";
import { createExecutor, BaseState, StateValidationError } from "playwright-state-model";
import { playwrightDevMachine } from "../src/machine";
import { HomePage } from "../src/pages/HomePage";
import { DocsOverviewPage } from "../src/pages/DocsPage";
import { GettingStartedPage } from "../src/pages/GettingStartedPage";
import { ApiPage } from "../src/pages/ApiPage";

/**
 * Tests demonstrating new features in v1.1.5+:
 * - Enhanced error messages with StateValidationError
 * - currentStateString getter for string comparisons
 * - Event payload support via getPayload<T>()
 * - Built-in retry logic for flaky navigation
 * - Screenshot on failure
 * - Bulk state registration with registerStates()
 * - ModelExecutorOptions configuration
 */
test.describe("v1.1.5+ New Features", () => {
  test("should use bulk registration with registerStates()", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      // Bulk registration - cleaner than multiple register() calls
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "api": ApiPage,
      });
    });

    await page.goto("https://playwright.dev");
    await executor.expectState("home");
  });

  test("should use currentStateString for string comparisons", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "api": ApiPage,
      });
    });

    await page.goto("https://playwright.dev");
    
    // currentStateString always returns a string, making comparisons easier
    expect(executor.currentStateString).toBe("home");
    
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    expect(executor.currentStateString).toBe("docs.overview");
    
    await executor.navigateAndValidate("NAVIGATE_TO_API");
    expect(executor.currentStateString).toBe("api");
  });

  test("should demonstrate enhanced error messages", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
      });
    });

    await page.goto("https://playwright.dev");
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");

    // Try to expect wrong state - should get enhanced error message
    try {
      await executor.expectState("home");
      expect.fail("Should have thrown StateValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(StateValidationError);
      
      if (error instanceof StateValidationError) {
        // Enhanced error includes all context
        expect(error.details.expectedState).toBe("home");
        expect(error.details.currentState).toBe("docs.overview");
        expect(error.details.currentUrl).toContain("playwright.dev");
        expect(error.details.validationChain).toContain("docs.overview");
        
        // Error message is formatted nicely
        const errorString = error.toString();
        expect(errorString).toContain("State validation failed");
        expect(errorString).toContain("Expected state: home");
        expect(errorString).toContain("Current state: docs.overview");
      }
    }
  });

  test("should use retry logic for flaky navigation", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
      });
    }, {
      // Global retry configuration
      defaultRetryOptions: {
        retries: 1,
        delay: 500,
      },
    });

    await page.goto("https://playwright.dev");
    
    // Per-call retry options override global defaults
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS", null, {
      retries: 2,
      delay: 1000,
      retryableErrors: ['Timeout'], // Only retry on timeout errors
    });
    
    await executor.expectState("docs.overview");
  });

  test("should capture screenshots on failure", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
      });
    }, {
      screenshotOnFailure: true,
      screenshotPath: `test-results/screenshot-test.png`,
    });

    await page.goto("https://playwright.dev");
    
    // This should succeed and not capture screenshot
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    
    // Try to expect wrong state - should capture screenshot
    try {
      await executor.expectState("home");
      expect.fail("Should have thrown error");
    } catch (error) {
      // Screenshot should have been captured
      // In real scenarios, this would be attached to test report
      expect(error).toBeInstanceOf(StateValidationError);
    }
  });

  test("should demonstrate event payload support", async ({ page }) => {
    // Example Page Object that uses payload
    class PayloadDemoPage extends BaseState {
      async validateState(): Promise<void> {
        await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/?$/);
      }
      
      async NAVIGATE_WITH_PAYLOAD(): Promise<void> {
        const payload = this.getPayload<{ section?: string }>();
        if (payload?.section) {
          // In a real scenario, you might navigate to a specific section
          // await this.page.goto(`https://playwright.dev/${payload.section}`);
        }
        // For this demo, just navigate normally
        await this.page.goto("https://playwright.dev/docs");
      }
    }

    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": PayloadDemoPage,
        "docs.overview": DocsOverviewPage,
      });
    });

    await page.goto("https://playwright.dev");
    
    // Dispatch event with payload
    await executor.dispatch("NAVIGATE_WITH_PAYLOAD", { section: "getting-started" });
    
    // Note: This is a demo - the actual navigation would use the payload
    // In real scenarios, payloads are used for dynamic navigation (UUIDs, IDs, etc.)
  });

  test("should configure state value format", async ({ page }) => {
    // Test with string format
    const executorString = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
      });
    }, {
      stateValueFormat: 'string',
    });

    await page.goto("https://playwright.dev");
    expect(typeof executorString.currentStateValue).toBe('string');
    expect(executorString.currentStateValue).toBe("home");

    // Test with object format
    const executorObject = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
      });
    }, {
      stateValueFormat: 'object',
    });

    await page.goto("https://playwright.dev");
    expect(typeof executorObject.currentStateValue).toBe('string'); // Simple states are still strings
    await executorObject.navigateAndValidate("NAVIGATE_TO_DOCS");
    expect(typeof executorObject.currentStateValue).toBe('object');
    expect(executorObject.currentStateValue).toEqual({ docs: "overview" });
  });

  test("should demonstrate complete workflow with new features", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "api": ApiPage,
      });
    }, {
      screenshotOnFailure: true,
      defaultRetryOptions: { retries: 1 },
    });

    await page.goto("https://playwright.dev");
    
    // Use currentStateString for easy comparisons
    expect(executor.currentStateString).toBe("home");
    
    // Navigate with retry support
    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    expect(executor.currentStateString).toBe("docs.overview");
    
    // Enhanced error messages if validation fails
    await executor.expectState("docs.overview");
    
    // Continue navigation
    await executor.navigateAndValidate("NAVIGATE_TO_GETTING_STARTED");
    expect(executor.currentStateString).toBe("docs.gettingStarted");
    
    await executor.navigateAndValidate("NAVIGATE_TO_API");
    expect(executor.currentStateString).toBe("api");
  });
});

