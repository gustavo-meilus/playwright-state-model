import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

/**
 * Page Object Model for Playwright.dev Documentation Overview Page.
 */
export class DocsOverviewPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs/);
    const h1 = this.page.locator("h1").first();
    await expect(h1).toBeVisible();
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
