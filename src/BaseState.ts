import { Page } from "@playwright/test";

/**
 * Abstract Base Class for all Page Objects.
 * Supports generic Context for Data-Driven testing.
 * Provides event payload support for dynamic navigation.
 */
export abstract class BaseState<TContext = any> {
  protected page: Page;
  public context: TContext;
  protected lastEventPayload: any = null;

  constructor(page: Page, context?: TContext) {
    this.page = page;
    this.context = context || ({} as TContext);
  }

  /**
   * Sets the event payload for the current event being handled.
   * Called automatically by ModelExecutor before event handler execution.
   * 
   * @internal
   */
  setEventPayload(payload: any): void {
    this.lastEventPayload = payload;
  }

  /**
   * Gets the payload from the last dispatched event with type safety.
   * Use this in event handler methods to access dynamic data (UUIDs, IDs, etc.).
   * 
   * @returns The event payload, typed as T
   * 
   * @example
   * ```typescript
   * async NAVIGATE_TO_LEAD_DETAIL(): Promise<void> {
   *   const payload = this.getPayload<{ leadId: string }>();
   *   if (!payload?.leadId) {
   *     throw new Error('NAVIGATE_TO_LEAD_DETAIL requires leadId in payload');
   *   }
   *   await this.page.goto(`/leads/${payload.leadId}`);
   * }
   * ```
   */
  protected getPayload<T = any>(): T {
    return this.lastEventPayload as T;
  }

  /**
   * Asserts that the current page matches this state's definition.
   * Must be implemented by concrete Page Objects.
   * Should include real UI assertions (URL checks, element visibility, content validation),
   * not just waiting for loading locators.
   */
  abstract validateState(): Promise<void>;
}
