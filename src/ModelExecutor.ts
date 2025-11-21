import { AnyStateMachine, interpret } from "xstate";
import { Page } from "@playwright/test";
import { StateFactory } from "./StateFactory";
import { BaseState } from "./BaseState";
import { resolveStatePaths } from "./utils";

/**
 * Thread-safe executor for XState machines with Playwright Page Objects.
 * Ensures serialized dispatch operations to prevent race conditions in multi-worker scenarios.
 */
export class ModelExecutor {
  private service: any;
  private dispatchQueue: Promise<void> = Promise.resolve();
  private disposed: boolean = false;

  constructor(
    private page: Page,
    private machine: AnyStateMachine,
    private factory: StateFactory
  ) {
    this.service = interpret(machine).start();
  }

  /**
   * Resolves the full hierarchy of Page Objects for the current state,
   * injecting the current XState Context.
   */
  private getActiveStateChain(): BaseState[] {
    if (this.disposed) {
      throw new Error("ModelExecutor has been disposed and cannot be used");
    }
    const stateValue = this.service.state.value;
    const machineContext = this.service.state.context;
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
      const nextState = this.service.nextState(event);
      
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

      this.service.send(event, payload);

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
    return this.service.state.value;
  }

  /**
   * Stops the XState interpreter and marks the executor as disposed.
   * Should be called when the executor is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.service && typeof this.service.stop === "function") {
      this.service.stop();
    }
  }
}
