import { Page } from "@playwright/test";
import { AnyStateMachine, interpret } from "xstate";
import { BaseState } from "./BaseState";
import { StateFactory } from "./StateFactory";
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

  constructor(
    private page: Page,
    private machine: AnyStateMachine,
    private factory: StateFactory
  ) {
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
    
    let stateValue: any;
    let machineContext: any;
    
    if (this.isXStateV5 && this.actor) {
      // XState v5 API
      const snapshot = this.actor.getSnapshot();
      if (!snapshot) {
        throw new Error("Actor snapshot is not available");
      }
      stateValue = snapshot.value ?? null;
      machineContext = snapshot.context ?? {};
    } else {
      // XState v4 API
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized. Ensure XState is properly installed.");
      }
      stateValue = this.service.state.value;
      machineContext = this.service.state.context;
    }
    
    const stateKeys = resolveStatePaths(stateValue);
    return stateKeys.map((key) => this.factory.get(key, machineContext));
  }

  /**
   * Validates the entire UI composition (Root -> Leaf).
   */
  async validateCurrentState(): Promise<void> {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    const chain = this.getActiveStateChain();

    for (const stateObj of chain) {
      await stateObj.validateState();
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
   */
  get currentStateValue() {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    
    if (this.isXStateV5 && this.actor) {
      // XState v5 API
      const snapshot = this.actor.getSnapshot();
      return snapshot?.value || null;
    } else {
      // XState v4 API
      if (!this.service || !this.service.state) {
        throw new Error("XState service is not initialized. Ensure XState is properly installed.");
      }
      return this.service.state.value;
    }
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
