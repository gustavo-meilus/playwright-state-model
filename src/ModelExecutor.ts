import { AnyStateMachine, interpret } from 'xstate';
import { Page } from '@playwright/test';
import { StateFactory } from './StateFactory';
import { BaseState } from './BaseState';
import { resolveStatePaths } from './utils';

export class ModelExecutor {
  private service: any;

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
    const stateValue = this.service.state.value;
    const machineContext = this.service.state.context;
    const stateKeys = resolveStatePaths(stateValue);
    
    return stateKeys.map((key) => this.factory.get(key, machineContext));
  }

  /**
   * Validates the entire UI composition (Root -> Leaf).
   */
  async validateCurrentState(): Promise<void> {
    const chain = this.getActiveStateChain();
    
    // Validate Top-Down
    for (const stateObj of chain) {
      await stateObj.validateState();
    }
  }

  /**
   * Dispatches an event using Bubbling logic (Leaf -> Root).
   */
  async dispatch(event: string, payload?: any): Promise<void> {
    console.log(`[Executor] Dispatching: ${event}`);
    
    const chain = this.getActiveStateChain();
    let handled = false;

    // 1. Find Handler (Bottom-Up)
    for (let i = chain.length - 1; i >= 0; i--) {
      const stateObj = chain[i];
      if (typeof (stateObj as any)[event] === 'function') {
        console.log(`[Executor] Handled by: ${stateObj.constructor.name}`);
        
        // Execute Action
        await (stateObj as any)[event](payload); 
        handled = true;
        break; 
      }
    }

    if (!handled) {
      throw new Error(`[Executor] Event '${event}' not handled by active chain.`);
    }

    // 2. Update State Machine
    const nextState = this.service.nextState(event);
    if (!nextState.changed) {
        console.warn(`[Executor] Warning: Event '${event}' did not result in a state change.`);
    }
    this.service.send(event, payload);

    // 3. Validate New State Hierarchy
    await this.validateCurrentState();
  }
  
  /**
   * Returns the current raw XState value.
   */
  get currentStateValue() {
      return this.service.state.value;
  }
}
