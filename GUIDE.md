# Playwright State Model - Quick Start Guide

A practical guide for QA Automation engineers to create UI tests using the state model approach.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Core Concepts](#core-concepts)
3. [Step-by-Step: Creating Your First Test](#step-by-step-creating-your-first-test)
4. [Common Patterns](#common-patterns)
5. [Hybrid Mode: Using Both Approaches](#hybrid-mode-using-both-approaches)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Basic knowledge of Playwright
- Understanding of Page Object Model
- Basic TypeScript knowledge
- Understanding of state machines (what states and transitions are)

---

## Core Concepts

### What is State Model Testing?

State model testing combines:

- **XState Machine**: Defines application states and valid transitions
- **Page Objects**: Encapsulate page-specific actions and validations
- **ModelExecutor**: Connects the machine to Page Objects and executes tests

### Key Components

1. **State Machine** (`machine.ts`): Defines states and transitions
2. **Page Objects** (`pages/*.ts`): Extend `BaseState`, implement actions and validations
3. **Factory** (`factory.ts`): Maps state IDs to Page Object classes
4. **Tests** (`*.spec.ts`): Use `ModelExecutor` to dispatch events and validate states

---

## Step-by-Step: Creating Your First Test

### Step 1: Define the State Machine

Create `src/machine.ts`:

```typescript
import { createMachine } from "xstate";

export const appMachine = createMachine({
  id: "app",
  initial: "home",
  states: {
    home: {
      id: "home",
      on: {
        NAVIGATE_TO_LOGIN: { target: "login" },
        NAVIGATE_TO_DASHBOARD: { target: "dashboard" },
      },
    },
    login: {
      id: "login",
      on: {
        NAVIGATE_TO_HOME: { target: "home" },
        SUBMIT_LOGIN: { target: "dashboard" },
      },
    },
    dashboard: {
      id: "dashboard",
      on: {
        NAVIGATE_TO_HOME: { target: "home" },
      },
    },
  },
});
```

**Key Points:**

- `id`: Unique identifier for the state
- `initial`: Starting state
- `on`: Event handlers that trigger transitions
- `target`: Destination state after event

### Step 2: Create Page Objects

Create `src/pages/HomePage.ts`:

```typescript
import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

export class HomePage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  // Required: Validate current page matches this state
  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/example\.com\/?$/);
    await expect(this.page.locator("h1")).toContainText("Welcome");
  }

  // Action methods: Named after events in state machine
  async NAVIGATE_TO_LOGIN(): Promise<void> {
    await this.page.getByRole("link", { name: "Login" }).click();
  }

  async NAVIGATE_TO_DASHBOARD(): Promise<void> {
    await this.page.getByRole("link", { name: "Dashboard" }).click();
  }
}
```

**Key Points:**

- Extend `BaseState`
- Implement `validateState()`: Assert page is in correct state
- Create action methods: Match event names from state machine (e.g., `NAVIGATE_TO_LOGIN`)
- Action methods perform the UI interaction

Create `src/pages/LoginPage.ts`:

```typescript
import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

export class LoginPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.page.locator("input[type='email']")).toBeVisible();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page.getByRole("link", { name: "Home" }).click();
  }

  async SUBMIT_LOGIN(): Promise<void> {
    await this.page.fill("input[type='email']", "user@example.com");
    await this.page.fill("input[type='password']", "password123");
    await this.page.getByRole("button", { name: "Login" }).click();
  }
}
```

Create `src/pages/DashboardPage.ts`:

```typescript
import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

export class DashboardPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.page.locator("h1")).toContainText("Dashboard");
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page.getByRole("link", { name: "Home" }).click();
  }
}
```

### Step 3: Register States in Factory

Create `src/factory.ts`:

```typescript
import { Page } from "@playwright/test";
import { StateFactory } from "playwright-state-model";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);

  // Register each state ID with its Page Object class
  factory.register("home", HomePage);
  factory.register("login", LoginPage);
  factory.register("dashboard", DashboardPage);

  return factory;
}
```

**Key Points:**

- State IDs must match machine state IDs exactly
- **CRITICAL**: Create one factory per test (never share factories between tests)
- Factories are lightweight - creating a new one per test ensures parallelism safety

### Step 4: Write Your Test

Create `tests/navigation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";

test("navigate from home to dashboard", async ({ page }) => {
  // 1. Create factory and executor
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);

  // 2. Navigate to initial state
  await page.goto("https://example.com");

  // 3. Validate initial state
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("home");

  // 4. Dispatch events to navigate
  await executor.dispatch("NAVIGATE_TO_LOGIN");
  expect(executor.currentStateValue).toBe("login");
  await executor.validateCurrentState();

  // 5. Continue navigation
  await executor.dispatch("SUBMIT_LOGIN");
  expect(executor.currentStateValue).toBe("dashboard");
  await executor.validateCurrentState();
});
```

**Key Points:**

- **CRITICAL**: Create fresh `factory` and `executor` instances per test (never share between tests)
- `ModelExecutor` connects machine, factory, and page
- `validateCurrentState()`: Validates UI matches expected state
- `dispatch(event)`: Triggers event and validates new state automatically
- `currentStateValue`: Get current state from machine
- **Parallelism Safety**: Each test must be completely isolated for safe parallel execution

---

## Common Patterns

### Pattern 1: Hierarchical States

For nested states (e.g., `docs.overview`):

**Machine:**

```typescript
docs: {
  id: "docs",
  initial: "overview",
  states: {
    overview: { id: "docs.overview" },
    details: { id: "docs.details" },
  },
}
```

**Factory:**

```typescript
factory.register("docs", DocsPage); // Parent
factory.register("docs.overview", DocsOverviewPage); // Child
factory.register("docs.details", DocsDetailsPage); // Child
```

**Result:** When state is `{ docs: "overview" }`, both `DocsPage` and `DocsOverviewPage` are validated.

### Pattern 2: Event Bubbling

Events bubble from child to parent. If child doesn't handle event, parent does:

**Machine:**

```typescript
docs: {
  id: "docs",
  states: {
    overview: { id: "docs.overview" },  // No NAVIGATE_TO_HOME handler
  },
  on: {
    NAVIGATE_TO_HOME: { target: "home" },  // Parent handles it
  },
}
```

**Result:** `NAVIGATE_TO_HOME` from `docs.overview` bubbles to `docs` state handler.

### Pattern 3: Network Request Validation

Wait for network requests during transitions:

```typescript
test("navigation with network validation", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);

  await page.goto("https://example.com");

  // Set up network listeners BEFORE dispatch
  const requestPromise = page
    .waitForRequest((req) => req.url().includes("/api/data"))
    .catch(() => null);
  const responsePromise = page
    .waitForResponse((res) => res.url().includes("/api/data") && res.status() === 200)
    .catch(() => null);

  // Dispatch and wait for navigation
  const urlPromise = page.waitForURL(/\/dashboard/);
  await Promise.all([executor.dispatch("NAVIGATE_TO_DASHBOARD"), urlPromise]);

  // Verify network requests
  const [request, response] = await Promise.all([requestPromise, responsePromise]);
  if (request && response) {
    expect(response.status()).toBe(200);
  }

  // Verify state
  expect(executor.currentStateValue).toBe("dashboard");
  await executor.validateCurrentState();
});
```

### Pattern 4: Context-Driven Testing

Use XState context for data-driven tests:

**Machine:**

```typescript
const machine = createMachine({
  context: { userId: null, userName: null },
  states: {
    dashboard: {
      id: "dashboard",
      // ... transitions
    },
  },
});
```

**Page Object:**

```typescript
export class DashboardPage extends BaseState<{ userId: string; userName: string }> {
  async validateState(): Promise<void> {
    // Access context data
    await expect(this.page.locator(`[data-user-id="${this.context.userId}"]`)).toBeVisible();
    await expect(this.page.locator("h1")).toContainText(this.context.userName);
  }
}
```

### Pattern 5: Multiple Paths from Same State

Test all navigation options:

```typescript
test.describe("Navigation from Home", () => {
  test("to login", async ({ page }) => {
    // ✅ CORRECT - Fresh executor per test
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, appMachine, factory);
    await page.goto("https://example.com");
    await executor.dispatch("NAVIGATE_TO_LOGIN");
    expect(executor.currentStateValue).toBe("login");
  });

  test("to dashboard", async ({ page }) => {
    // ✅ CORRECT - Fresh executor per test
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, appMachine, factory);
    await page.goto("https://example.com");
    await executor.dispatch("NAVIGATE_TO_DASHBOARD");
    expect(executor.currentStateValue).toBe("dashboard");
  });
});
```

### Pattern 6: Using Constants and Test Helpers

**Create Constants** (`src/constants.ts`):

```typescript
export const BASE_URL = "https://example.com";

export const URL_PATTERNS = {
  HOME: /^https:\/\/example\.com\/?$/,
  LOGIN: /\/login/,
  DASHBOARD: /\/dashboard/,
} as const;

export const STATE_VALUES = {
  HOME: "home",
  LOGIN: "login",
  DASHBOARD: "dashboard",
} as const;

export const EVENTS = {
  NAVIGATE_TO_LOGIN: "NAVIGATE_TO_LOGIN",
  NAVIGATE_TO_DASHBOARD: "NAVIGATE_TO_DASHBOARD",
  SUBMIT_LOGIN: "SUBMIT_LOGIN",
} as const;
```

**Create Test Helpers** (`tests/helpers/test-setup.ts`):

```typescript
import { Page } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../../src/machine";
import { createStateFactory } from "../../src/factory";
import { BASE_URL, STATE_VALUES } from "../../src/constants";
import { expect } from "@playwright/test";

export function createTestExecutor(page: Page): ModelExecutor {
  const factory = createStateFactory(page);
  return new ModelExecutor(page, appMachine, factory);
}

export async function initializeTest(page: Page): Promise<ModelExecutor> {
  const executor = createTestExecutor(page);
  await page.goto(BASE_URL);
  await executor.validateCurrentState();
  return executor;
}

export async function initializeTestFromHome(page: Page): Promise<ModelExecutor> {
  const executor = await initializeTest(page);
  expect(executor.currentStateValue).toBe(STATE_VALUES.HOME);
  return executor;
}

export { expect };
```

**Use in Tests:**

```typescript
import { test } from "@playwright/test";
import { initializeTestFromHome, expect } from "./helpers/test-setup";
import { EVENTS, STATE_VALUES } from "../src/constants";

test("navigate to login", async ({ page }) => {
  const executor = await initializeTestFromHome(page);

  await executor.dispatch(EVENTS.NAVIGATE_TO_LOGIN);
  expect(executor.currentStateValue).toBe(STATE_VALUES.LOGIN);
  await executor.validateCurrentState();
});
```

### Pattern 7: Parallelism Safety and Test Isolation

**✅ CORRECT - Isolated Test:**

```typescript
test("navigation test", async ({ page }) => {
  // Fresh instances per test - safe for parallel execution
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);

  await page.goto("https://example.com");
  await executor.dispatch("NAVIGATE_TO_LOGIN");
  expect(executor.currentStateValue).toBe("login");
});
```

**❌ WRONG - Shared Executor (Race Condition):**

```typescript
let executor: ModelExecutor; // ❌ Shared between tests

test.beforeAll(async ({ page }) => {
  executor = new ModelExecutor(page, appMachine, factory); // ❌ Shared!
});

test("test 1", async () => {
  await executor.dispatch("EVENT"); // ❌ Race condition risk!
});
```

**Verification:**

```bash
# Verify parallelism safety
npx playwright test --repeat-each 10 --workers 5
```

---

## Hybrid Mode: Using Both Approaches

Use state model for complex flows, standard POM for edge cases and quick tests.

### When to Use State Model

✅ Core user flows (checkout, registration, multi-step forms)
✅ Critical paths requiring formal verification
✅ Complex stateful workflows
✅ When you need state coverage analysis

### When to Use Standard POM

✅ Edge cases and bug reproduction
✅ Exploratory testing
✅ One-off tests
✅ Simple, linear navigation
✅ When state machine doesn't fit the scenario

### Hybrid Implementation

**Helper Function:**

```typescript
// tests/helpers/test-setup.ts
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";
import { Page } from "@playwright/test";

// ✅ CORRECT - Creates fresh instances per call (safe for parallelism)
export function createExecutor(page: Page): ModelExecutor {
  const factory = createStateFactory(page); // Fresh factory
  return new ModelExecutor(page, appMachine, factory); // Fresh executor
}
```

**Note:** Helper functions that create fresh instances per call are safe for parallel execution. Never cache or share executors or factories between tests.

**State Model Test:**

```typescript
import { test, expect } from "@playwright/test";
import { createExecutor } from "./helpers";

test("complete checkout flow", async ({ page }) => {
  const executor = createExecutor(page);
  await page.goto("https://example.com");

  // Use state model for complex flow
  await executor.dispatch("ADD_TO_CART");
  await executor.dispatch("GO_TO_CHECKOUT");
  await executor.dispatch("ENTER_SHIPPING");
  await executor.dispatch("SUBMIT_ORDER");

  expect(executor.currentStateValue).toBe("orderConfirmation");
});
```

**Standard POM Test:**

```typescript
import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../src/pages/CheckoutPage";

test("invalid credit card handling", async ({ page }) => {
  // Use standard POM for edge case
  const checkout = new CheckoutPage(page);
  await checkout.goto();
  await checkout.enterCreditCard("0000-0000-0000-0000");
  await checkout.submit();

  // Direct validation without state machine
  await expect(checkout.errorMessage).toBeVisible();
  await expect(checkout.errorMessage).toContainText("Invalid card");
});
```

**Mixed Test:**

```typescript
import { test, expect } from "@playwright/test";
import { createExecutor } from "./helpers";
import { CheckoutPage } from "../src/pages/CheckoutPage";

test("checkout with error recovery", async ({ page }) => {
  const executor = createExecutor(page);
  await page.goto("https://example.com");

  // State model for main flow
  await executor.dispatch("ADD_TO_CART");
  await executor.dispatch("GO_TO_CHECKOUT");

  // Standard POM for error scenario
  const checkout = new CheckoutPage(page);
  await checkout.enterInvalidCard();
  await checkout.submit();
  await expect(checkout.errorMessage).toBeVisible();

  // Back to state model
  await checkout.fixCard();
  await executor.dispatch("SUBMIT_ORDER");
  expect(executor.currentStateValue).toBe("orderConfirmation");
});
```

### Migration Strategy

**Phase 1: Start with Standard POM**

- Write new tests using standard POM
- Establish test coverage

**Phase 2: Identify Complex Flows**

- Find multi-step workflows
- Identify stateful features

**Phase 3: Migrate Complex Flows**

- Create state machine for complex flows
- Migrate tests gradually
- Keep simple tests as standard POM

**Phase 4: Hybrid Maintenance**

- Use state model for new complex features
- Use standard POM for edge cases
- Document which approach to use when

---

## Troubleshooting

### Problem: "Event 'X' not handled by state machine"

**Cause:** Event not defined in current state's `on` object.

**Solution:** Add event to state machine:

```typescript
home: {
  on: {
    NAVIGATE_TO_X: { target: "x" },  // Add this
  },
}
```

### Problem: "Event 'X' not handled by active chain"

**Cause:** Page Object doesn't have method matching event name.

**Solution:** Add method to Page Object:

```typescript
class HomePage extends BaseState {
  async NAVIGATE_TO_X(): Promise<void> {
    // Add this
    await this.page.getByRole("link", { name: "X" }).click();
  }
}
```

### Problem: State validation fails

**Cause:** `validateState()` assertions don't match current page.

**Solution:** Check:

1. URL pattern matches actual URL
2. Selectors are correct
3. Page loaded completely (add waits if needed)

```typescript
async validateState(): Promise<void> {
  // Add wait if needed
  await this.page.waitForLoadState("networkidle");

  // Check actual URL in browser
  await expect(this.page).toHaveURL(/\/expected-path/);
}
```

### Problem: State ID mismatch

**Cause:** State ID in factory doesn't match machine state ID.

**Solution:** Ensure exact match:

```typescript
// Machine
home: {
  id: "home";
}

// Factory
factory.register("home", HomePage); // Must match exactly
```

### Problem: Hierarchical state not validating

**Cause:** Missing parent state registration in factory.

**Solution:** Register both parent and child:

```typescript
factory.register("docs", DocsPage); // Parent
factory.register("docs.overview", DocsOverviewPage); // Child
```

### Problem: Event bubbles to wrong handler

**Cause:** Event handler exists in both parent and child.

**Solution:** Child handler executes first (bottom-up). Remove duplicate handler or ensure correct one exists.

### Problem: Tests fail with multiple workers but pass with one worker

**Cause:** Shared state, non-isolated tests, or race conditions.

**Solution:** Ensure complete test isolation:

```typescript
// ❌ WRONG - Shared executor
let executor: ModelExecutor;
test.beforeAll(async ({ page }) => {
  executor = new ModelExecutor(page, machine, factory);
});

// ✅ CORRECT - Fresh executor per test
test("test", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, machine, factory);
  // ... test code
});
```

**Verification:**

```bash
# Run with multiple workers to catch race conditions
npx playwright test --repeat-each 10 --workers 5
```

### Problem: Flaky tests under parallel execution

**Cause:** Timing dependencies, shared resources, or race conditions.

**Solution:**

- Remove all shared state between tests
- Use Playwright's auto-waiting instead of `waitForTimeout()`
- Ensure each test creates its own executor and factory
- Use element visibility checks instead of timing

```typescript
// ❌ WRONG - Timing dependency
await page.waitForTimeout(1000); // Race condition risk

// ✅ CORRECT - Auto-waiting
await expect(page.locator("h1")).toBeVisible(); // Playwright auto-waits
```

---

## Quick Reference

### Test Structure Template

```typescript
import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { yourMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";

test("your test name", async ({ page }) => {
  // 1. Setup - CRITICAL: Create fresh instances per test for parallelism safety
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, yourMachine, factory);

  // 2. Navigate to initial state
  await page.goto("https://your-app.com");

  // 3. Validate initial state
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("initialState");

  // 4. Dispatch events
  await executor.dispatch("EVENT_NAME");
  expect(executor.currentStateValue).toBe("newState");
  await executor.validateCurrentState();

  // 5. Continue as needed
});
```

### Page Object Template

```typescript
import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

export class YourPage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/\/your-path/);
    // Add more assertions
  }

  async EVENT_NAME(): Promise<void> {
    // Perform UI action
    await this.page.getByRole("button", { name: "Click Me" }).click();
  }
}
```

---

## Summary

1. **State Machine**: Define states and transitions
2. **Page Objects**: Extend `BaseState`, implement `validateState()` and action methods
3. **Factory**: Register state IDs to Page Object classes
4. **Tests**: Use `ModelExecutor` to dispatch events and validate states
5. **Hybrid**: Use state model for complex flows, standard POM for edge cases
6. **Parallelism Safety**: Always create fresh executor and factory instances per test
7. **Best Practices**: Use constants and test helpers to reduce duplication while maintaining isolation

**Remember:**

- State IDs must match exactly between machine and factory
- Event names in Page Objects must match machine event names
- Always validate state after navigation
- Use hybrid approach for flexibility
- **CRITICAL**: Create fresh executor and factory instances per test (never share)
- **Parallelism Safety**: Each test must be completely isolated for safe parallel execution
- Verify parallelism safety with `--repeat-each 10 --workers 5`
- Use constants and test helpers to reduce code duplication while maintaining isolation

---

## Parallelism and Race Condition Safety

### Key Principles

1. **Test Isolation**: Each test must be completely independent
   - Create fresh `ModelExecutor` and factory instances per test
   - Never share executors, factories, or state between tests
   - Each test uses its own `page` fixture

2. **No Shared State**: Avoid global variables, singletons, or shared resources
   - Factories are lightweight - safe to create per test
   - Executors contain state - must be isolated per test

3. **Auto-Waiting**: Use Playwright's built-in auto-waiting
   - Avoid `waitForTimeout()` - creates timing dependencies
   - Use element visibility checks: `expect(locator).toBeVisible()`

4. **Verification**: Always verify parallelism safety
   ```bash
   npx playwright test --repeat-each 10 --workers 5
   ```

### Common Anti-Patterns

**❌ Shared Executor:**

```typescript
let executor: ModelExecutor; // Shared!
test.beforeAll(async ({ page }) => {
  executor = new ModelExecutor(page, machine, factory);
});
```

**❌ Shared Factory:**

```typescript
const factory = createStateFactory(page); // Created once, reused
```

**❌ Timing Dependencies:**

```typescript
await page.waitForTimeout(1000); // Race condition risk
```

### Best Practices

- ✅ Create fresh instances per test
- ✅ Use constants for magic strings
- ✅ Use test helpers that create fresh instances
- ✅ Leverage Playwright's auto-waiting
- ✅ Verify with parallel execution

## Additional Resources

- [Main README](../README.md) - Full documentation
- [Example Implementation](../example/) - Complete working example with parallelism-safe patterns
- [XState Documentation](https://xstate.js.org) - State machine reference
- [Playwright Documentation](https://playwright.dev) - Playwright reference
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) - Parallelism and test isolation
