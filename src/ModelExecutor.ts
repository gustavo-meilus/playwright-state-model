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
    // Dynamically check for createActor to support both versions
    try {
      // Try to import createActor (XState v5)
      const xstateModule = require("xstate") as typeof XState;
      const createActor = (xstateModule as any).createActor;
      
      if (typeof createActor === "function") {
        try {
          this.actor = createActor(machine);
          this.actor.start();
          this.isXStateV5 = true;
        } catch (error) {
          // Fallback to v4 API if createActor fails
          this.service = interpret(machine).start();
          this.isXStateV5 = false;
        }
      } else {
        // XState v4 API
        this.service = interpret(machine).start();
        this.isXStateV5 = false;
      }
    } catch {
      // If require fails or createActor doesn't exist, use v4 API
      this.service = interpret(machine).start();
      this.isXStateV5 = false;
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
      stateValue = snapshot.value;
      machineContext = snapshot.context;
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
        // XState v5 API
        const snapshot = this.actor.getSnapshot();
        const transition = this.actor.machine.transition(snapshot, { type: event, ...payload });
        nextState = transition;
      } else {
        // XState v4 API
        if (!this.service) {
          throw new Error("XState service is not initialized");
        }
        nextState = this.service.nextState(event);
      }
      
      if (!nextState.changed) {
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

      // Send event to actor/service
      if (this.isXStateV5 && this.actor) {
        this.actor.send({ type: event, ...payload });
      } else {
        this.service.send(event, payload);
      }

      await this.validateCurrentState();
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
