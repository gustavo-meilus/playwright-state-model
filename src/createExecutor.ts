import { Page } from "@playwright/test";
import { AnyStateMachine } from "xstate";
import { ModelExecutor } from "./ModelExecutor";
import { StateFactory } from "./StateFactory";
import { ModelExecutorOptions } from "./types";

/**
 * Convenience function to create a ModelExecutor with reduced boilerplate.
 * Combines StateFactory creation and ModelExecutor initialization into a single call.
 * 
 * @param page - Playwright Page instance
 * @param machine - XState state machine
 * @param factoryCreator - Function that creates and configures a StateFactory
 * @param options - Optional ModelExecutor configuration options
 * @returns Configured ModelExecutor instance
 * 
 * @example
 * ```typescript
 * const executor = createExecutor(
 *   page,
 *   appMachine,
 *   (factory) => {
 *     factory.register("home", HomePage);
 *     factory.register("dashboard", DashboardPage);
 *   },
 *   {
 *     screenshotOnFailure: true,
 *     defaultRetryOptions: { retries: 2 }
 *   }
 * );
 * ```
 */
export function createExecutor(
  page: Page,
  machine: AnyStateMachine,
  factoryCreator: (factory: StateFactory) => void,
  options?: ModelExecutorOptions
): ModelExecutor {
  const factory = new StateFactory(page);
  factoryCreator(factory);
  return new ModelExecutor(page, machine, factory, options);
}

