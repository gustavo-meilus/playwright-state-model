/**
 * Application constants for Playwright.dev example tests.
 * Centralizes magic strings and values to improve maintainability.
 */

export const BASE_URL = "https://playwright.dev";

export const URL_PATTERNS = {
  HOME: /^https:\/\/playwright\.dev\/?$/,
  DOCS: /^https:\/\/playwright\.dev\/docs/,
  DOCS_OVERVIEW: /^https:\/\/playwright\.dev\/docs(\/intro)?\/?(\?|#|$)/,
  DOCS_GETTING_STARTED: /^https:\/\/playwright\.dev\/docs\/(getting-started|intro)/,
  DOCS_API: /^https:\/\/playwright\.dev\/docs\/api/,
} as const;

export const STATE_VALUES = {
  HOME: "home",
  API: "api",
  DOCS_OVERVIEW: { docs: "overview" },
  DOCS_GETTING_STARTED: { docs: "gettingStarted" },
} as const;

export const EVENTS = {
  NAVIGATE_TO_DOCS: "NAVIGATE_TO_DOCS",
  NAVIGATE_TO_API: "NAVIGATE_TO_API",
  NAVIGATE_TO_HOME: "NAVIGATE_TO_HOME",
  NAVIGATE_TO_GETTING_STARTED: "NAVIGATE_TO_GETTING_STARTED",
  NAVIGATE_TO_OVERVIEW: "NAVIGATE_TO_OVERVIEW",
} as const;

