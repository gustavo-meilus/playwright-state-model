import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

/**
 * Page Object Model for Playwright.dev API Documentation Page.
 */
export class ApiPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs\/api\/?/);
    await expect(this.page.locator("h1")).toBeVisible();
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
