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
   * Should include real UI assertions (URL checks, element visibility, content validation),
   * not just waiting for loading locators.
   */
  abstract validateState(): Promise<void>;
}
