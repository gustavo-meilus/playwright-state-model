import { test } from "@playwright/test";
import {
  initializeTest,
  initializeTestFromHome,
  expect,
} from "./helpers/test-setup";
import { STATE_VALUES, EVENTS } from "../src/constants";

test.describe("Playwright.dev Navigation Model", () => {
  test("should navigate through states using XState model", async ({ page }) => {
    const executor = await initializeTestFromHome(page);

    await executor.dispatch(EVENTS.NAVIGATE_TO_DOCS);
    expect(executor.currentStateValue).toEqual(STATE_VALUES.DOCS_OVERVIEW);

    await executor.dispatch(EVENTS.NAVIGATE_TO_GETTING_STARTED);
    expect(executor.currentStateValue).toEqual(STATE_VALUES.DOCS_GETTING_STARTED);

    await executor.dispatch(EVENTS.NAVIGATE_TO_OVERVIEW);
    expect(executor.currentStateValue).toEqual(STATE_VALUES.DOCS_OVERVIEW);

    await executor.dispatch(EVENTS.NAVIGATE_TO_API);
    expect(executor.currentStateValue).toBe(STATE_VALUES.API);

    await executor.dispatch(EVENTS.NAVIGATE_TO_HOME);
    expect(executor.currentStateValue).toBe(STATE_VALUES.HOME);
  });

  test("should handle direct navigation to API from home", async ({ page }) => {
    const executor = await initializeTestFromHome(page);

    await executor.dispatch(EVENTS.NAVIGATE_TO_API);
    expect(executor.currentStateValue).toBe(STATE_VALUES.API);

    await executor.validateCurrentState();
  });

  test("should validate state hierarchy correctly", async ({ page }) => {
    const executor = await initializeTest(page);

    await executor.dispatch(EVENTS.NAVIGATE_TO_DOCS);
    expect(executor.currentStateValue).toEqual(STATE_VALUES.DOCS_OVERVIEW);

    await executor.dispatch(EVENTS.NAVIGATE_TO_GETTING_STARTED);
    expect(executor.currentStateValue).toEqual(STATE_VALUES.DOCS_GETTING_STARTED);

    await executor.validateCurrentState();
  });
});
