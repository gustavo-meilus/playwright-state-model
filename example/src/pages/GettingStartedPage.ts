import { Page, expect } from '@playwright/test';
import { BaseState } from 'poc-model-state-playwright';

/**
 * Page Object Model for Playwright.dev Getting Started Page.
 */
export class GettingStartedPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs\/getting-started/);
    await expect(this.page.locator('h1')).toContainText(/Getting started/i);
  }

  async NAVIGATE_TO_OVERVIEW(): Promise<void> {
    await this.page.getByRole('link', { name: /docs/i }).or(this.page.getByRole('link', { name: /documentation/i })).first().click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page.getByRole('link', { name: /home/i }).or(this.page.getByRole('link', { name: /playwright/i })).first().click();
  }
}
