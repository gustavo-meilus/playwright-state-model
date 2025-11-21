import { Page } from "@playwright/test";

/**
 * Abstract Base Class for all Page Objects.
 * Supports generic Context for Data-Driven testing.
 */
export abstract class BaseState<TContext = any> {
  protected page: Page;
  public context: TContext;

  constructor(page: Page, context?: TContext) {
    this.page = page;
    this.context = context || ({} as TContext);
  }

  /**
   * Asserts that the current page matches this state's definition.
   * Must be implemented by concrete Page Objects.
   */
  abstract validateState(): Promise<void>;
}
