import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";
import { URL_PATTERNS } from "../constants";

/**
 * Page Object Model for Playwright.dev Homepage.
 * Follows Single Responsibility Principle - handles only home page interactions.
 */
export class HomePage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.HOME);
    await expect(this.page.locator("h1")).toContainText(/Playwright/i);
  }

  async goto(): Promise<void> {
    await this.page.goto("https://playwright.dev");
  }

  async NAVIGATE_TO_DOCS(): Promise<void> {
    await this.page.getByRole("link", { name: /docs/i }).first().click();
  }

  async NAVIGATE_TO_API(): Promise<void> {
    await this.page.getByRole("link", { name: /api/i }).first().click();
  }
}
