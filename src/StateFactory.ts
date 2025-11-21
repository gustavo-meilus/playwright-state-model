import { Page } from "@playwright/test";
import { BaseState } from "./BaseState";
import { StateConstructor } from "./types";

/**
 * Manages the mapping between XState IDs and Playwright Page Objects.
 * Thread-safe: Each instance is independent and can be safely used across
 * multiple test workers without shared state concerns.
 */
export class StateFactory {
  private page: Page;
  private definitions: Map<string, StateConstructor<any>> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Registers a XState node ID to a Page Object Class.
   */
  register(id: string, stateClass: StateConstructor<any>): void {
    this.definitions.set(id, stateClass);
  }

  /**
   * Bulk registers multiple state IDs to Page Object classes.
   * Reduces boilerplate when registering many states.
   * 
   * @param states - Object mapping state IDs to Page Object classes
   * 
   * @example
   * ```typescript
   * factory.registerStates({
   *   'dashboard': DashboardPage,
   *   'leads.current': CurrentLeadsPage,
   *   'leads.single': SingleLeadPage,
   * });
   * ```
   */
  registerStates(states: Record<string, StateConstructor<any>>): void {
    for (const [id, stateClass] of Object.entries(states)) {
      this.register(id, stateClass);
    }
  }

  /**
   * Creates a Page Object injected with specific Context Data.
   * Each call creates a new instance, ensuring no shared state between calls.
   */
  get<T extends BaseState>(id: string, context: any): T {
    const StateClass = this.definitions.get(id);
    if (!StateClass) {
      throw new Error(`StateFactory: No class registered for State ID '${id}'`);
    }

    return new StateClass(this.page, context) as T;
  }

  /**
   * Returns an array of all registered state IDs.
   * Useful for state synchronization and discovery.
   */
  getRegisteredStates(): string[] {
    return Array.from(this.definitions.keys());
  }
}
