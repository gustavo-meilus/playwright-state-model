import { Page } from "@playwright/test";
import type * as XState from "xstate";
import { AnyStateMachine, interpret } from "xstate";
import { BaseState } from "./BaseState";
import { StateFactory } from "./StateFactory";
import { resolveStatePaths } from "./utils";

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
    // Detect XState version and use appropriate API
    // XState v5 uses createActor, v4 uses interpret
    // Try to get createActor dynamically (XState v5)
    let createActorFn: any;
    try {
      const xstateModule = require("xstate");
      createActorFn = xstateModule.createActor;
    } catch {
      createActorFn = undefined;
    }
    
    // Prefer createActor if available (XState v5), fallback to interpret
    if (typeof createActorFn === "function") {
      try {
        this.actor = createActorFn(machine);
        this.actor.start();
        this.isXStateV5 = true;
      } catch (error) {
        // createActor failed, try interpret
        // In XState v5, interpret also returns an actor, so check for that
        try {
          const interpreted = interpret(machine).start();
          // Check if interpret returned an actor (v5) or service (v4)
          if (typeof interpreted.getSnapshot === "function") {
            // XState v5: interpret returns an actor
            this.actor = interpreted;
            this.isXStateV5 = true;
          } else {
            // XState v4: interpret returns a service
            this.service = interpreted;
            this.isXStateV5 = false;
          }
        } catch (interpretError) {
          throw new Error(
            `Failed to initialize XState. createActor error: ${error instanceof Error ? error.message : String(error)}. ` +
            `interpret error: ${interpretError instanceof Error ? interpretError.message : String(interpretError)}`
          );
        }
      }
    } else {
      // createActor not available, use interpret (XState v4)
      try {
        const interpreted = interpret(machine).start();
        // Check if interpret returned an actor (v5) or service (v4)
        if (typeof interpreted.getSnapshot === "function") {
          // XState v5: interpret returns an actor
          this.actor = interpreted;
          this.isXStateV5 = true;
        } else {
          // XState v4: interpret returns a service
          this.service = interpreted;
          this.isXStateV5 = false;
        }
      } catch (error) {
        throw new Error(
          `Failed to initialize XState with interpret: ${error instanceof Error ? error.message : String(error)}. ` +
          `Ensure XState is properly installed (npm install xstate).`
        );
      }
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
