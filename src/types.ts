import { Page, Request, Response } from "@playwright/test";
import { BaseState } from "./BaseState";

/**
 * Defines side effects to wait for during a transition.
 */
export interface TransitionOptions {
  waitForNavigation?: {
    url?: string | RegExp;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  };
  waitForRequest?: string | RegExp | ((request: Request) => boolean);
  waitForResponse?: string | RegExp | ((response: Response) => boolean);
  waitForPredicate?: () => Promise<boolean>;
}

/**
 * Defines a transition to a generic state.
 */
export interface ITransition<TNext> {
  targetState: new (page: Page, context?: any) => TNext;
  options?: TransitionOptions;
  expectError?: boolean;
}

/**
 * Constructor type for dynamic instantiation.
 */
export type StateConstructor<T extends BaseState> = new (page: Page, context?: any) => T;
