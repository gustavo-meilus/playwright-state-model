import { Locator } from "@playwright/test";
import { ITransition } from "./types";

/**
 * A smart locator that binds a UI element to an action, side effects, and a result state.
 */
export class ActionLocator<TNext> {
  constructor(
    private locator: Locator,
    private transition: ITransition<TNext>,
    public description: string
  ) {}

  /**
   * Executes the interaction and handles all defined side effects efficiently.
   */
  async perform(
    action: "click" | "dblclick" | "hover" | "fill" | "check" | "uncheck",
    arg1?: any,
    arg2?: any
  ): Promise<TNext> {
    const page = this.locator.page();
    const promises: Promise<any>[] = [];

    // 1. Queue Side Effects (MUST happen before action to prevent race conditions)
    const opts = this.transition.options;
    if (opts) {
      if (opts.waitForNavigation) {
        promises.push(
          page.waitForURL(opts.waitForNavigation.url || "**", {
            waitUntil: opts.waitForNavigation.waitUntil,
          })
        );
      }
      if (opts.waitForResponse) promises.push(page.waitForResponse(opts.waitForResponse));
      if (opts.waitForRequest) promises.push(page.waitForRequest(opts.waitForRequest));
      if (opts.waitForPredicate) promises.push(opts.waitForPredicate());
    }

    // 2. Queue the Action
    const actionPromise = (async () => {
      if (action === "click") await this.locator.click(arg1);
      else if (action === "dblclick") await this.locator.dblclick(arg1);
      else if (action === "hover") await this.locator.hover(arg1);
      else if (action === "fill") await this.locator.fill(arg1, arg2);
      else if (action === "check") await this.locator.check(arg1);
      else if (action === "uncheck") await this.locator.uncheck(arg1);
    })();
    promises.push(actionPromise);

    // 3. Await all
    await Promise.all(promises);

    // 4. Instantiate Next State
    // Note: We do NOT pass context here effectively, because the ModelExecutor
    // is responsible for re-resolving the state chain with fresh context from XState.
    // However, for standalone usage, we instantiate a basic version.
    const NextStateClass = this.transition.targetState;
    const nextStateInstance = new NextStateClass(page);

    // 5. Optional Auto-Validation (can be disabled if relying on Executor)
    if ((nextStateInstance as any).validateState) {
      await (nextStateInstance as any).validateState();
    }

    return nextStateInstance;
  }

  /**
   * Exposes raw locator for custom assertions.
   */
  get raw(): Locator {
    return this.locator;
  }
}
