import { Page, Request, Response, TestInfo } from "@playwright/test";
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

/**
 * Options for retry logic in navigation and validation operations.
 */
export interface RetryOptions {
  /**
   * Number of retry attempts (default: 0).
   * Total attempts = retries + 1 (initial attempt + retries).
   */
  retries?: number;
  
  /**
   * Delay in milliseconds between retry attempts (default: 1000).
   */
  delay?: number;
  
  /**
   * Array of error message patterns that should trigger a retry.
   * If empty, all errors will trigger retry (up to retries limit).
   * If specified, only errors matching these patterns will be retried.
   */
  retryableErrors?: string[];
}

/**
 * Configuration options for ModelExecutor.
 */
export interface ModelExecutorOptions {
  /**
   * Enable automatic screenshot capture on validation failures.
   * Default: false
   */
  screenshotOnFailure?: boolean;
  
  /**
   * Path or function to generate screenshot path on failure.
   * If function, receives TestInfo and returns path string.
   * Default: `test-results/failure-{timestamp}.png`
   */
  screenshotPath?: string | ((testInfo?: TestInfo) => string);
  
  /**
   * TestInfo instance for attaching screenshots to test reports.
   * Optional - if not provided, screenshots will still be saved but not attached.
   */
  testInfo?: TestInfo;
  
  /**
   * Default retry options for navigateAndValidate operations.
   * Can be overridden per-call.
   */
  defaultRetryOptions?: RetryOptions;
  
  /**
   * State value format preference.
   * - 'object': Always return hierarchical object (e.g., { leads: 'current' })
   * - 'string': Always return flattened string (e.g., 'leads.current')
   * - 'auto': Return string for simple states, object for hierarchical (default)
   */
  stateValueFormat?: 'object' | 'string' | 'auto';
}

/**
 * Detailed error information for state validation failures.
 */
export interface StateValidationErrorDetails {
  expectedState: string;
  currentState: any;
  currentUrl: string;
  validationChain: string[];
  originalError: Error | null;
}
