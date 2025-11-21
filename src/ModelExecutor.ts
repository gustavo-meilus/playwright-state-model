import { Page } from "@playwright/test";
import { AnyStateMachine, interpret } from "xstate";
import { BaseState } from "./BaseState";
import { StateFactory } from "./StateFactory";
import { StateValidationError } from "./StateValidationError";
import { ModelExecutorOptions, RetryOptions } from "./types";
import { resolveStatePaths } from "./utils";

/**
 * Safely gets createActor from xstate module.
 * Works in both CJS and ESM contexts, including Playwright test environments.
 * Since both XState v4 and v5 export interpret(), we can always fall back to that.
 */
function getCreateActor(): any {
  try {
    // Try require first (CJS environments)
    if (typeof require !== "undefined" && typeof require.resolve === "function") {
      try {
        const xstateModule = require("xstate");
        if (xstateModule && typeof xstateModule.createActor === "function") {
          return xstateModule.createActor;
        }
      } catch (requireError) {
        // require failed, continue to other methods
      }
    }
  } catch {
    // require check failed
  }
  
  // If require didn't work, we'll fall back to interpret() which is always available
  // This ensures compatibility even in strict ESM environments
  return undefined;
}

/**
 * Thread-safe executor for XState machines with Playwright Page Objects.
 * Ensures serialized dispatch operations to prevent race conditions in multi-worker scenarios.
 * Supports both XState v4 (interpret) and v5 (createActor) APIs.
 */
export class ModelExecutor {
  private service: any;
  private actor: any;
  private isXStateV5: boolean = false;
  private dispatchQueue: Promise<void> = Promise.resolve();
  private disposed: boolean = false;
  private options: ModelExecutorOptions;

  constructor(
    private page: Page,
    private machine: AnyStateMachine,
    private factory: StateFactory,
    options?: ModelExecutorOptions
  ) {
    this.options = options || {};
    // Initialize XState - use createActor if available (v5), otherwise use interpret
    // Both XState v4 and v5 export interpret(), so we can always use it as fallback
    // In v5, interpret() returns an actor; in v4, it returns a service
    
    // Try to get createActor (XState v5)
    const createActorFn = getCreateActor();
    
    // Try createActor first if available (XState v5)
    if (typeof createActorFn === "function") {
      try {
        this.actor = createActorFn(machine);
        this.actor.start();
        this.isXStateV5 = true;
        return;
      } catch (error) {
        // createActor failed, fall through to interpret
      }
    }
    
    // Use interpret (works for both v4 and v5)
    // This is the most reliable method as both versions export it
    try {
      const interpreted = interpret(machine).start();
      
      // Check if interpret returned an actor (v5) or service (v4)
      // XState v5 actors have getSnapshot(), v4 services have .state property
      // Use type assertion to check properties safely
      const interpretedAny = interpreted as any;
      
      if (typeof interpretedAny.getSnapshot === "function") {
        // XState v5: interpret returns an actor with getSnapshot()
        this.actor = interpretedAny;
        this.isXStateV5 = true;
      } else if (interpretedAny.state && typeof interpretedAny.state.value !== "undefined") {
        // XState v4: interpret returns a service with .state.value property
        this.service = interpretedAny;
        this.isXStateV5 = false;
      } else {
        // Unexpected result - throw error
        throw new Error(
          "XState interpret() returned an unexpected result. " +
          "Expected actor (v5) with getSnapshot() or service (v4) with .state. " +
          "Ensure XState is properly installed (npm install xstate)."
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize XState: ${error instanceof Error ? error.message : String(error)}. ` +
        `Ensure XState is properly installed (npm install xstate@^4.30.0 || ^5.0.0).`
      );
    }
  }

  /**
   * Resolves the full hierarchy of Page Objects for the current state,
   * injecting the current XState Context.
   */
  private getActiveStateChain(): BaseState[] {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    
    const stateValue = this.getRawStateValue();
    let machineContext: any;
    
    if (this.isXStateV5 && this.actor) {
      // XState v5 API
      const snapshot = this.actor.getSnapshot();
      if (!snapshot) {
        throw new Error("Actor snapshot is not available");
      }
      machineContext = snapshot.context ?? {};
    } else {
      // XState v4 API
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized. Ensure XState is properly installed.");
      }
      machineContext = this.service.state.context;
    }
    
    const stateKeys = resolveStatePaths(stateValue);
    return stateKeys.map((key) => this.factory.get(key, machineContext));
  }

  /**
   * Validates the entire UI composition (Root -> Leaf).
   * Provides detailed error messages if validation fails.
   */
  async validateCurrentState(): Promise<void> {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    const chain = this.getActiveStateChain();
    const rawStateValue = this.getRawStateValue();
    const statePaths = resolveStatePaths(rawStateValue);

    if (chain.length === 0) {
      throw new StateValidationError({
        expectedState: statePaths[statePaths.length - 1] || String(rawStateValue),
        currentState: this.currentStateString,
        currentUrl: this.page.url(),
        validationChain: [],
        originalError: new Error(
          `No Page Objects found for state: ${JSON.stringify(rawStateValue)}. ` +
          `Ensure all states are registered in StateFactory.`
        ),
      });
    }

    for (let i = 0; i < chain.length; i++) {
      const stateObj = chain[i];
      const stateId = statePaths[i];
      
      try {
        await stateObj.validateState();
      } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        throw new StateValidationError({
          expectedState: stateId,
          currentState: this.currentStateString,
          currentUrl: this.page.url(),
          validationChain: statePaths.slice(0, i + 1),
          originalError,
        });
      }
    }
  }

  /**
   * Dispatches an event using Bubbling logic (Leaf -> Root).
   * Thread-safe: Serializes concurrent dispatches to prevent race conditions.
   */
  async dispatch(event: string, payload?: any): Promise<void> {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }

    const previousDispatch = this.dispatchQueue;
    let resolveDispatch: (() => void) | undefined;
    let rejectDispatch: ((error: Error) => void) | undefined;
    
    this.dispatchQueue = new Promise<void>((resolve, reject) => {
      resolveDispatch = resolve;
      rejectDispatch = reject;
    });

    const executeDispatch = async (): Promise<void> => {
      let nextState: any;
      
      if (this.isXStateV5 && this.actor) {
        // XState v5 API: Check current state, send event, then check if state changed
        const snapshotBefore = this.actor.getSnapshot();
        const stateBefore = snapshotBefore.value;
        
        // Find handler in Page Object chain
        const chain = this.getActiveStateChain();
        
        // Set payload in all states in chain before handler execution
        for (const state of chain) {
          if ('setEventPayload' in state) {
            (state as any).setEventPayload(payload);
          }
        }
        
        let handled = false;

        for (let i = chain.length - 1; i >= 0; i--) {
          const stateObj = chain[i];
          if (typeof (stateObj as any)[event] === "function") {
            await (stateObj as any)[event](payload);
            handled = true;
            break;
          }
        }

        // Send event to XState (even if no handler found - XState will ignore invalid events)
        this.actor.send({ type: event, ...payload });
        
        // Check if state actually changed
        const snapshotAfter = this.actor.getSnapshot();
        const stateAfter = snapshotAfter.value;
        const changed = JSON.stringify(stateBefore) !== JSON.stringify(stateAfter);
        
        if (!changed) {
          // State didn't change - XState ignored the event (invalid transition)
          // If there was no handler, that's fine - XState rejected it
          // If there was a handler but state didn't change, that's also fine
          return;
        }
        
        // State changed - if there was no handler, that's an error
        if (!handled) {
          throw new Error(`[Executor] Event '${event}' not handled by active chain.`);
        }
        
        // State changed and handler was called - validate the new state
        await this.validateCurrentState();
      } else {
        // XState v4 API
        if (!this.service) {
          throw new Error("XState service is not initialized");
        }
        const nextState = this.service.nextState(event);
        
        if (!nextState.changed) {
          // XState would ignore this event - return gracefully
          return;
        }

        const chain = this.getActiveStateChain();
        
        // Set payload in all states in chain before handler execution
        for (const state of chain) {
          if ('setEventPayload' in state) {
            (state as any).setEventPayload(payload);
          }
        }
        
        let handled = false;

        for (let i = chain.length - 1; i >= 0; i--) {
          const stateObj = chain[i];
          if (typeof (stateObj as any)[event] === "function") {
            await (stateObj as any)[event](payload);
            handled = true;
            break;
          }
        }

        if (!handled) {
          throw new Error(`[Executor] Event '${event}' not handled by active chain.`);
        }

        // Send event to service
        this.service.send(event, payload);

        await this.validateCurrentState();
      }
    };

    try {
      await previousDispatch;
      await executeDispatch();
      if (resolveDispatch) {
        resolveDispatch();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (rejectDispatch) {
        rejectDispatch(err);
      }
      throw err;
    }
  }

  /**
   * Returns the current raw XState value.
   * Format depends on options.stateValueFormat setting.
   */
  get currentStateValue() {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    
    let value: any;
    
    if (this.isXStateV5 && this.actor) {
      // XState v5 API
      const snapshot = this.actor.getSnapshot();
      value = snapshot?.value || null;
    } else {
      // XState v4 API
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized. Ensure XState is properly installed.");
      }
      value = this.service.state.value;
    }
    
    const format = this.options.stateValueFormat || 'auto';
    if (format === 'string') {
      return this.flattenStateValue(value);
    } else if (format === 'object') {
      return value;
    } else {
      // 'auto': return string for simple states, object for hierarchical
      return typeof value === 'string' ? value : value;
    }
  }

  /**
   * Returns the raw XState state value without formatting.
   * Used internally for state resolution and comparison.
   * 
   * @internal
   */
  private getRawStateValue(): any {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    
    if (this.isXStateV5 && this.actor) {
      const snapshot = this.actor.getSnapshot();
      return snapshot?.value || null;
    } else {
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized. Ensure XState is properly installed.");
      }
      return this.service.state.value;
    }
  }

  /**
   * Returns the current state value as a flattened string.
   * Useful for string comparisons and logging.
   * 
   * @example
   * ```typescript
   * executor.currentStateString // 'leads.current'
   * executor.currentStateValue   // { leads: 'current' } or 'leads.current' (depends on format)
   * ```
   */
  get currentStateString(): string {
    const value = this.currentStateValue;
    if (typeof value === 'string') {
      return value;
    }
    return this.flattenStateValue(value);
  }

  /**
   * Flattens a hierarchical state value into a dot-separated string.
   * Example: { leads: 'current' } -> 'leads.current'
   */
  private flattenStateValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      const parts: string[] = [];
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          parts.push(`${key}.${val}`);
        } else if (typeof val === 'object' && val !== null) {
          const nested = this.flattenStateValue(val);
          parts.push(`${key}.${nested}`);
        } else {
          parts.push(key);
        }
      }
      return parts[0] || '';
    }
    return String(value);
  }

  /**
   * Convenience method: Dispatches an event and validates the resulting state.
   * Equivalent to calling dispatch() followed by validateCurrentState().
   * Supports retry logic for flaky navigation scenarios.
   * 
   * @param event - The event name to dispatch
   * @param payload - Optional payload for the event
   * @param options - Optional retry options (overrides defaultRetryOptions from constructor)
   * @returns Promise that resolves when transition and validation complete
   * 
   * @example
   * ```typescript
   * await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
   * await executor.navigateAndValidate("NAVIGATE_TO_LEADS", null, {
   *   retries: 2,
   *   delay: 1000,
   *   retryableErrors: ['Timeout', 'Network']
   * });
   * ```
   */
  async navigateAndValidate(
    event: string,
    payload?: any,
    options?: RetryOptions
  ): Promise<void> {
    const retryOptions = options || this.options.defaultRetryOptions || {};
    const { retries = 0, delay = 1000, retryableErrors = [] } = retryOptions;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.dispatch(event, payload);
        await this.validateCurrentState();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const shouldRetry = attempt < retries && (
          retryableErrors.length === 0 ||
          retryableErrors.some(pattern => lastError!.message.includes(pattern))
        );
        
        if (!shouldRetry) {
          if (this.options.screenshotOnFailure) {
            await this.captureScreenshot(lastError);
          }
          throw lastError;
        }
        
        // Wait before retry
        await this.page.waitForTimeout(delay);
      }
    }
    
    if (lastError) {
      if (this.options.screenshotOnFailure) {
        await this.captureScreenshot(lastError);
      }
      throw lastError;
    }
  }

  /**
   * Convenience method: Validates current state and asserts state value matches expected.
   * Combines validateCurrentState() with state value assertion for common test patterns.
   * Provides enhanced error messages with full context.
   * 
   * @param expectedState - The expected state value (string or object)
   * @param options - Optional validation options
   * @param options.strict - If true, validates UI state even if state machine matches (default: false)
   * @returns Promise that resolves when validation passes
   * @throws StateValidationError if validation fails or state doesn't match
   * 
   * @example
   * ```typescript
   * await executor.expectState("home");
   * await executor.expectState("leads.current");
   * await executor.expectState({ docs: "overview" });
   * await executor.expectState("dashboard", { strict: true });
   * ```
   */
  async expectState(expectedState: any, options?: { strict?: boolean }): Promise<void> {
    try {
      await this.validateCurrentState();
    } catch (error) {
      const rawStateValue = this.getRawStateValue();
      const expectedStateStr = typeof expectedState === 'string' 
        ? expectedState 
        : this.flattenStateValue(expectedState);
      
      if (error instanceof StateValidationError) {
        // Update the error with expected state context
        throw new StateValidationError({
          expectedState: expectedStateStr,
          currentState: error.details.currentState,
          currentUrl: error.details.currentUrl,
          validationChain: error.details.validationChain,
          originalError: error.details.originalError,
        });
      }
      
      throw new StateValidationError({
        expectedState: expectedStateStr,
        currentState: this.currentStateString,
        currentUrl: this.page.url(),
        validationChain: resolveStatePaths(rawStateValue),
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
    
    const rawStateValue = this.getRawStateValue();
    const expectedStateStr = typeof expectedState === 'string' 
      ? expectedState 
      : this.flattenStateValue(expectedState);
    const actualStateStr = this.currentStateString;
    
    if (actualStateStr !== expectedStateStr) {
      throw new StateValidationError({
        expectedState: expectedStateStr,
        currentState: actualStateStr,
        currentUrl: this.page.url(),
        validationChain: resolveStatePaths(rawStateValue),
        originalError: null,
      });
    }
    
    if (options?.strict) {
      await this.validateCurrentState();
    }
  }

  /**
   * Captures a screenshot on failure if screenshotOnFailure is enabled.
   * 
   * @internal
   */
  private async captureScreenshot(error: Error): Promise<void> {
    if (!this.options.screenshotOnFailure) {
      return;
    }

    try {
      const path = typeof this.options.screenshotPath === 'function'
        ? this.options.screenshotPath(this.options.testInfo)
        : this.options.screenshotPath || `test-results/failure-${Date.now()}.png`;
      
      await this.page.screenshot({ path, fullPage: true });
      
      if (this.options.testInfo) {
        this.options.testInfo.attachments.push({
          name: 'state-validation-failure',
          path,
          contentType: 'image/png',
        });
      }
    } catch (screenshotError) {
      // Don't throw - screenshot failure shouldn't mask the original error
    }
  }

  /**
   * Navigates directly to a target state by finding the appropriate Page Object
   * and calling its goto() method (if available).
   * This provides a state-machine-aware alternative to direct page.goto() calls.
   * 
   * Note: This method navigates to the page but does not update the state machine.
   * After navigation, use syncStateFromPage() to verify the page matches the expected state,
   * or use navigateAndValidate() if you need state transitions.
   * 
   * @param targetState - The target state value (string or object)
   * @returns Promise that resolves when navigation completes
   * @throws Error if state is not registered or goto() method is not available
   * 
   * @example
   * ```typescript
   * // Instead of: await app.dashboard.goto();
   * await executor.gotoState("dashboard");
   * await executor.syncStateFromPage(); // Verify page matches expected state
   * await executor.expectState("dashboard");
   * ```
   */
  async gotoState(targetState: any): Promise<void> {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }

    const stateKeys = resolveStatePaths(targetState);
    if (stateKeys.length === 0) {
      throw new Error(
        `[ModelExecutor] Invalid target state: ${JSON.stringify(targetState)}`
      );
    }

    const leafStateKey = stateKeys[stateKeys.length - 1];
    let machineContext: any;
    
    if (this.isXStateV5 && this.actor) {
      const snapshot = this.actor.getSnapshot();
      machineContext = snapshot?.context ?? {};
    } else {
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized");
      }
      machineContext = this.service.state.context;
    }

    const stateObj = this.factory.get(leafStateKey, machineContext);
    
    if (typeof (stateObj as any).goto !== "function") {
      throw new Error(
        `[ModelExecutor] Page Object for state '${leafStateKey}' does not have a goto() method. ` +
        `Add a goto() method to navigate directly to this state.`
      );
    }

    await (stateObj as any).goto();
  }

  /**
   * Synchronizes the state machine with the current page state by detecting
   * which Page Object matches the current page and updating the state machine accordingly.
   * This is useful when navigation happens outside the state machine (e.g., direct URL changes).
   * 
   * @returns Promise that resolves when state is synchronized
   * @throws Error if no matching state is found for the current page
   * 
   * @example
   * ```typescript
   * await page.goto("https://example.com/dashboard");
   * await executor.syncStateFromPage();
   * await executor.expectState("dashboard");
   * ```
   */
  async syncStateFromPage(): Promise<void> {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }

    const registeredStates = this.factory.getRegisteredStates();
    let matchedState: string | null = null;
    let matchedStateObj: BaseState | null = null;

    const sortedStates = registeredStates.sort((a, b) => {
      const aDepth = a.split(".").length;
      const bDepth = b.split(".").length;
      return bDepth - aDepth;
    });

    for (const stateKey of sortedStates) {
      try {
        let machineContext: any;
        
        if (this.isXStateV5 && this.actor) {
          const snapshot = this.actor.getSnapshot();
          machineContext = snapshot?.context ?? {};
        } else {
          if (!this.service || !this.service.state) {
            continue;
          }
          machineContext = this.service.state.context;
        }

        const stateObj = this.factory.get(stateKey, machineContext);
        
        try {
          await stateObj.validateState();
          matchedState = stateKey;
          matchedStateObj = stateObj;
          break;
        } catch {
          continue;
        }
      } catch {
        continue;
      }
    }

    if (!matchedState || !matchedStateObj) {
      throw new Error(
        `[ModelExecutor] Could not sync state from page. ` +
        `No registered Page Object matches the current page state. ` +
        `Current URL: ${this.page.url()}`
      );
    }

    const stateValue = this.resolveStateValueFromKey(matchedState);
    
    if (this.isXStateV5 && this.actor) {
      const snapshot = this.actor.getSnapshot();
      const currentValue = snapshot?.value;
      
      if (JSON.stringify(currentValue) !== JSON.stringify(stateValue)) {
        throw new Error(
          `[ModelExecutor] State sync requires manual state machine update. ` +
          `Current state: ${JSON.stringify(currentValue)}, ` +
          `Detected page state: ${JSON.stringify(stateValue)}. ` +
          `Use navigateAndValidate() or dispatch() to transition states properly.`
        );
      }
    } else {
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized");
      }
      const currentValue = this.service.state.value;
      
      if (JSON.stringify(currentValue) !== JSON.stringify(stateValue)) {
        throw new Error(
          `[ModelExecutor] State sync requires manual state machine update. ` +
          `Current state: ${JSON.stringify(currentValue)}, ` +
          `Detected page state: ${JSON.stringify(stateValue)}. ` +
          `Use navigateAndValidate() or dispatch() to transition states properly.`
        );
      }
    }
  }

  /**
   * Resolves a state key (e.g., "docs.overview") into a full state value object.
   * Handles hierarchical state paths.
   * Example: "docs.overview" -> { docs: "overview" }
   */
  private resolveStateValueFromKey(stateKey: string): any {
    const parts = stateKey.split(".");
    
    if (parts.length === 1) {
      return stateKey;
    }
    
    if (parts.length === 2) {
      return { [parts[0]]: parts[1] };
    }
    
    let result: any = {};
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = parts[parts.length - 1];
    
    return result;
  }

  /**
   * Stops the XState interpreter/actor and marks the executor as disposed.
   * Should be called when the executor is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    
    if (this.isXStateV5 && this.actor) {
      // XState v5 API
      if (typeof this.actor.stop === "function") {
        this.actor.stop();
      }
    } else {
      // XState v4 API
      if (this.service && typeof this.service.stop === "function") {
        this.service.stop();
      }
    }
  }
}
