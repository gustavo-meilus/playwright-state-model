import { test, expect } from "@playwright/test";
import { createExecutor, BaseState } from "playwright-state-model";
import { Page } from "@playwright/test";
import { playwrightDevMachine } from "../src/machine";
import { HomePage } from "../src/pages/HomePage";
import { DocsOverviewPage } from "../src/pages/DocsPage";
import { GettingStartedPage } from "../src/pages/GettingStartedPage";
import { ApiPage } from "../src/pages/ApiPage";

/**
 * Tests demonstrating new features in v1.1.4:
 * - gotoState() for state-driven navigation
 * - syncStateFromPage() for state synchronization
 * - Enhanced expectState() with options
 */
test.describe("v1.1.4 New Features", () => {
  test("should use gotoState() for state-driven navigation", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      // Using bulk registration (v1.1.5+ feature)
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "docs.api": ApiPage,
        "api": ApiPage,
      });
    });

    await executor.gotoState("home");
    await executor.syncStateFromPage();
    await executor.expectState("home");

    await executor.gotoState({ docs: "overview" });
    await expect(async () => {
      await executor.syncStateFromPage();
    }).rejects.toThrow(/State sync requires manual state machine update/);

    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });
  });

  test("should use syncStateFromPage() to detect state mismatches", async ({
    page,
  }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "docs.api": ApiPage,
        "api": ApiPage,
      });
    });

    await executor.gotoState("home");
    await executor.expectState("home");

    await page.goto("https://playwright.dev/docs");

    await expect(async () => {
      await executor.syncStateFromPage();
    }).rejects.toThrow(/State sync requires manual state machine update/);

    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });
  });

  test("should use syncStateFromPage() when state machine is in sync", async ({
    page,
  }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "docs.api": ApiPage,
        "api": ApiPage,
      });
    });

    await executor.gotoState("home");
    await executor.syncStateFromPage();
    await executor.expectState("home");

    await executor.navigateAndValidate("NAVIGATE_TO_DOCS");
    await executor.expectState({ docs: "overview" });

    await executor.syncStateFromPage();
    await executor.expectState({ docs: "overview" });
  });

  test("should use enhanced expectState() with strict mode", async ({ page }) => {
    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.registerStates({
        "home": HomePage,
        "docs": DocsOverviewPage,
        "docs.overview": DocsOverviewPage,
        "docs.gettingStarted": GettingStartedPage,
        "docs.api": ApiPage,
        "api": ApiPage,
      });
    });

    await executor.gotoState("home");
    await executor.syncStateFromPage();
    await executor.expectState("home", { strict: true });

    await executor.navigateAndValidate("NAVIGATE_TO_API");
    await executor.expectState("api", { strict: true });
  });

  test("should handle gotoState() error when goto() method is missing", async ({
    page,
  }) => {
    class HomePageWithoutGoto extends BaseState {
      async validateState(): Promise<void> {
        await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/?$/);
      }
      // Intentionally not implementing goto() method
    }

    const executor = createExecutor(page, playwrightDevMachine, (factory) => {
      factory.register("home", HomePageWithoutGoto);
    });

    await expect(async () => {
      await executor.gotoState("home");
    }).rejects.toThrow(/does not have a goto\(\) method/);
  });
});

