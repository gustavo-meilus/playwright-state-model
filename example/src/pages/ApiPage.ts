import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";
import { URL_PATTERNS } from "../constants";

/**
 * Page Object Model for Playwright.dev API Documentation Page.
 * Follows Single Responsibility Principle - handles only API page interactions.
 */
export class ApiPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    // Matches /docs/api/class-playwright, /docs/api, etc.
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCS_API);
    await expect(this.page.locator("h1")).toBeVisible();
  }

  async goto(): Promise<void> {
    await this.page.goto("https://playwright.dev/docs/api");
  }

  async NAVIGATE_TO_DOCS(): Promise<void> {
    await this.page.getByRole("link", { name: /docs/i }).first().click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page
      .getByRole("link", { name: /home/i })
      .or(this.page.getByRole("link", { name: /playwright/i }))
      .first()
      .click();
  }
}
