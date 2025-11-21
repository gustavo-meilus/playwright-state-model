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
}
