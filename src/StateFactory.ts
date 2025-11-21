import { Page } from "@playwright/test";
import { BaseState } from "./BaseState";
import { StateConstructor } from "./types";

/**
 * Manages the mapping between XState IDs and Playwright Page Objects.
 */
export class StateFactory {
  private page: Page;
  private definitions: Map<string, StateConstructor<any>> = new Map();

  // Stores the last created instance for debugging/logging
  private lastInstance: BaseState | null = null;

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
   */
  get<T extends BaseState>(id: string, context: any): T {
    const StateClass = this.definitions.get(id);
    if (!StateClass) {
      throw new Error(`StateFactory: No class registered for State ID '${id}'`);
    }

    const instance = new StateClass(this.page, context);
    this.lastInstance = instance;
    return instance as T;
  }
}
