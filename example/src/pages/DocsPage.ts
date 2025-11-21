import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";
import { URL_PATTERNS } from "../constants";

/**
 * Page Object Model for Playwright.dev Documentation Overview Page.
 * Handles both 'docs' (parent) and 'docs.overview' (child) states.
 * Follows Single Responsibility Principle - handles only docs overview page interactions.
 */
export class DocsOverviewPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    // Validates both 'docs' (parent) and 'docs.overview' (child) states
    // Accepts any /docs/* URL except /docs/api (which has its own state)
    const url = this.page.url();
    const isApiPage = url.includes("/docs/api");
    
    if (isApiPage) {
      throw new Error(`Expected docs overview page but found API page: ${url}`);
    }
    
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCS);
    await expect(this.page.locator("h1").first()).toBeVisible();
  }

  async NAVIGATE_TO_GETTING_STARTED(): Promise<void> {
    await this.page
      .getByRole("link", { name: /getting started/i })
      .first()
      .click();
  }

  async NAVIGATE_TO_API(): Promise<void> {
    await this.page.getByRole("link", { name: /api/i }).first().click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page
      .getByRole("link", { name: /home/i })
      .or(this.page.getByRole("link", { name: /playwright/i }))
      .first()
      .click();
  }
}
