# Playwright.dev Application - Comprehensive Model-Based Test Plan

## Application Overview

The Playwright.dev website is a documentation site for the Playwright testing framework. The application features:

- **Home Page**: Landing page with navigation to documentation and API
- **Documentation Section**: Hierarchical documentation with overview and getting started pages
- **API Section**: API reference documentation
- **Navigation**: Multiple navigation paths between sections
- **State Hierarchy**: Nested states (docs.overview, docs.gettingStarted)
- **Network Requests**: All navigation actions trigger HTTP requests to load new content

## XState Machine Definition

```typescript
import { createMachine } from "xstate";

export const playwrightDevMachine = createMachine({
  id: "playwrightDev",
  predictableActionArguments: true,
  initial: "home",
  context: {
    currentPage: "home",
  },
  states: {
    home: {
      id: "home",
      on: {
        NAVIGATE_TO_DOCS: {
          target: "docs",
        },
        NAVIGATE_TO_API: {
          target: "#docs.api",
        },
      },
    },
    docs: {
      id: "docs",
      initial: "overview",
      states: {
        overview: {
          id: "docs.overview",
          on: {
            NAVIGATE_TO_GETTING_STARTED: {
              target: "gettingStarted",
            },
            NAVIGATE_TO_API: {
              target: "#docs.api",
            },
            NAVIGATE_TO_HOME: {
              target: "#home",
            },
          },
        },
        gettingStarted: {
          id: "docs.gettingStarted",
          on: {
            NAVIGATE_TO_OVERVIEW: {
              target: "overview",
            },
            NAVIGATE_TO_HOME: {
              target: "#home",
            },
          },
        },
      },
      on: {
        NAVIGATE_TO_API: {
          target: "#docs.api",
        },
        NAVIGATE_TO_HOME: {
          target: "#home",
        },
      },
    },
    api: {
      id: "docs.api",
      on: {
        NAVIGATE_TO_DOCS: {
          target: "#docs",
        },
        NAVIGATE_TO_HOME: {
          target: "#home",
        },
      },
    },
  },
});
```

## Page Object Models

### HomePage

- **State ID**: `home`
- **Validation**: URL matches `https://playwright.dev`, main heading contains "Playwright"
- **Events**: `NAVIGATE_TO_DOCS()`, `NAVIGATE_TO_API()`

```typescript
export class HomePage extends BaseState {
  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/?$/);
    await expect(this.page.locator("h1")).toContainText(/Playwright/i);
  }

  async NAVIGATE_TO_DOCS(): Promise<void> {
    await this.page.getByRole("link", { name: /docs/i }).first().click();
  }

  async NAVIGATE_TO_API(): Promise<void> {
    await this.page.getByRole("link", { name: /api/i }).first().click();
  }
}
```

### DocsOverviewPage

- **State ID**: `docs.overview`
- **Validation**: URL matches `/docs`, heading visible
- **Events**: `NAVIGATE_TO_GETTING_STARTED()`, `NAVIGATE_TO_API()`, `NAVIGATE_TO_HOME()`

```typescript
export class DocsOverviewPage extends BaseState {
  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs/);
    const h1 = this.page.locator("h1").first();
    await expect(h1).toBeVisible();
  }

  async NAVIGATE_TO_GETTING_STARTED(): Promise<void> {
    await this.page
      .getByRole("link", { name: /getting started/i })
      .first()
      .click();
  }

  async NAVIGATE_TO_API(): Promise<void> {
    await this.page.getByRole("link", { name: /api/i }).first().click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page
      .getByRole("link", { name: /home/i })
      .or(this.page.getByRole("link", { name: /playwright/i }))
      .first()
      .click();
  }
}
```

### GettingStartedPage

- **State ID**: `docs.gettingStarted`
- **Validation**: URL matches `/docs/getting-started`, heading visible
- **Events**: `NAVIGATE_TO_OVERVIEW()`, `NAVIGATE_TO_HOME()`

```typescript
export class GettingStartedPage extends BaseState {
  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs\/getting-started/);
    await expect(this.page.locator("h1")).toContainText(/Getting started/i);
  }

  async NAVIGATE_TO_OVERVIEW(): Promise<void> {
    await this.page
      .getByRole("link", { name: /docs/i })
      .or(this.page.getByRole("link", { name: /documentation/i }))
      .first()
      .click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page
      .getByRole("link", { name: /home/i })
      .or(this.page.getByRole("link", { name: /playwright/i }))
      .first()
      .click();
  }
}
```

### ApiPage

- **State ID**: `docs.api` or `api`
- **Validation**: URL matches `/docs/api`, heading visible
- **Events**: `NAVIGATE_TO_DOCS()`, `NAVIGATE_TO_HOME()`

```typescript
export class ApiPage extends BaseState {
  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL(/^https:\/\/playwright\.dev\/docs\/api\/?/);
    await expect(this.page.locator("h1")).toBeVisible();
  }

  async NAVIGATE_TO_DOCS(): Promise<void> {
    await this.page.getByRole("link", { name: /docs/i }).first().click();
  }

  async NAVIGATE_TO_HOME(): Promise<void> {
    await this.page
      .getByRole("link", { name: /home/i })
      .or(this.page.getByRole("link", { name: /playwright/i }))
      .first()
      .click();
  }
}
```

## StateFactory Configuration

```typescript
import { Page } from "@playwright/test";
import { StateFactory } from "playwright-state-model";
import { HomePage } from "./pages/HomePage";
import { DocsOverviewPage } from "./pages/DocsPage";
import { GettingStartedPage } from "./pages/GettingStartedPage";
import { ApiPage } from "./pages/ApiPage";

export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);

  factory.register("home", HomePage);
  factory.register("docs", DocsOverviewPage);
  factory.register("docs.overview", DocsOverviewPage);
  factory.register("docs.gettingStarted", GettingStartedPage);
  factory.register("docs.api", ApiPage);
  factory.register("api", ApiPage);

  return factory;
}
```

## Test Scenarios

### 1. Complete Navigation Flow Through All States

**File**: `tests/navigation/complete-flow.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`, `GettingStartedPage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Assert initial state: `expect(executor.currentStateValue).toBe("home")`
5. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
6. Assert hierarchical state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
7. Validate docs overview state: `await executor.validateCurrentState()`
8. Dispatch navigation to getting started: `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
9. Assert nested state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
10. Validate getting started state: `await executor.validateCurrentState()`
11. Dispatch navigation back to overview: `await executor.dispatch("NAVIGATE_TO_OVERVIEW")`
12. Assert state change: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
13. Dispatch navigation to API: `await executor.dispatch("NAVIGATE_TO_API")`
14. Assert API state: `expect(executor.currentStateValue).toBe("api")`
15. Validate API state: `await executor.validateCurrentState()`
16. Dispatch navigation to home: `await executor.dispatch("NAVIGATE_TO_HOME")`
17. Assert final state: `expect(executor.currentStateValue).toBe("home")`
18. Validate home state: `await executor.validateCurrentState()`

**Expected Results:**

- All state transitions occur correctly
- State values match expected XState values
- Hierarchical states resolve correctly (`docs.overview`, `docs.gettingStarted`)
- Page Object validations pass at each step
- UI reflects the correct state at each transition

**Edge Cases to Consider:**

- Network delays during navigation
- Page load timing variations
- State validation timing

---

### 2. Direct Navigation to API from Home

**File**: `tests/navigation/direct-api-navigation.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Assert initial state: `expect(executor.currentStateValue).toBe("home")`
5. Dispatch direct navigation to API: `await executor.dispatch("NAVIGATE_TO_API")`
6. Assert API state: `expect(executor.currentStateValue).toBe("api")`
7. Validate API state: `await executor.validateCurrentState()`

**Expected Results:**

- Direct navigation from home to API works correctly
- State transitions to `api` state
- Page Object validation confirms API page is displayed

**Edge Cases to Consider:**

- Direct navigation bypasses intermediate states
- State machine correctly resolves absolute state reference (`#docs.api`)

---

### 3. Hierarchical State Validation

**File**: `tests/validation/hierarchical-state.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `DocsOverviewPage`, `GettingStartedPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
5. Assert hierarchical state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
6. Validate state hierarchy: `await executor.validateCurrentState()`
7. Dispatch navigation to getting started: `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
8. Assert nested state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
9. Validate nested state hierarchy: `await executor.validateCurrentState()`

**Expected Results:**

- Hierarchical states resolve correctly
- Both parent (`docs`) and child (`docs.gettingStarted`) states are validated
- State validation occurs top-down (parent before child)
- State values correctly represent nested structure

**Edge Cases to Consider:**

- Missing Page Object registration for parent state
- State machine transition errors
- Page Object validation failures

---

### 4. Navigation to Docs Triggers Network Request

**File**: `tests/network/navigation-requests.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Set up network request listener: `const requestPromise = page.waitForRequest((request) => request.url().includes('/docs') && request.method() === 'GET')`
5. Set up network response listener: `const responsePromise = page.waitForResponse((response) => response.url().includes('/docs') && response.status() === 200)`
6. Dispatch navigation to docs: `await Promise.all([executor.dispatch("NAVIGATE_TO_DOCS"), requestPromise, responsePromise])`
7. Assert hierarchical state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
8. Validate docs overview state: `await executor.validateCurrentState()`
9. Verify request URL contains `/docs`
10. Verify response status is 200

**Expected Results:**

- Network request is made to `/docs` endpoint
- Response status is successful (200)
- State transition occurs after network request completes
- Page Object validation confirms correct page loaded

**Edge Cases to Consider:**

- Network request timeout
- Failed network requests (4xx, 5xx errors)
- Slow network conditions
- Request/response timing variations

---

### 5. Navigation to API Triggers Network Request

**File**: `tests/network/navigation-requests.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Set up network request listener for `/api` endpoint
5. Set up network response listener with status 200
6. Dispatch navigation to API: `await Promise.all([executor.dispatch("NAVIGATE_TO_API"), requestPromise, responsePromise])`
7. Assert API state: `expect(executor.currentStateValue).toBe("api")`
8. Validate API state: `await executor.validateCurrentState()`
9. Verify request URL contains `/docs/api` or `/api`
10. Verify response status is 200

**Expected Results:**

- Network request is made to API endpoint
- Response status is successful
- State transitions to `api` state
- Page Object validation confirms API page is displayed

**Edge Cases to Consider:**

- API endpoint variations
- Network request redirects
- Response caching behavior

---

### 6. Navigation to Getting Started Triggers Network Request

**File**: `tests/network/navigation-requests.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `DocsOverviewPage`, `GettingStartedPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
4. Validate docs overview state: `await executor.validateCurrentState()`
5. Set up network request listener for `/docs/getting-started` endpoint
6. Set up network response listener with status 200
7. Dispatch navigation to getting started: `await Promise.all([executor.dispatch("NAVIGATE_TO_GETTING_STARTED"), requestPromise, responsePromise])`
8. Assert nested state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
9. Validate getting started state: `await executor.validateCurrentState()`
10. Verify request URL contains `/docs/getting-started`
11. Verify response status is 200

**Expected Results:**

- Network request is made to getting started endpoint
- Response status is successful
- State transitions to nested `docs.gettingStarted` state
- Page Object validation confirms getting started page is displayed

**Edge Cases to Consider:**

- Nested route navigation
- State hierarchy maintained during network request
- Parent state validation during child navigation

---

### 7. Multiple Navigation Requests in Sequence

**File**: `tests/network/sequential-navigation-requests.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`, `GettingStartedPage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Set up network listeners for each navigation step
5. Navigate: `home` → `docs.overview` (verify network request)
6. Navigate: `docs.overview` → `docs.gettingStarted` (verify network request)
7. Navigate: `docs.gettingStarted` → `docs.overview` (verify network request)
8. Navigate: `docs.overview` → `api` (verify network request)
9. Navigate: `api` → `home` (verify network request)
10. Verify all network requests completed successfully
11. Verify all state transitions occurred correctly
12. Validate final state: `await executor.validateCurrentState()`

**Expected Results:**

- Each navigation triggers appropriate network request
- Requests complete before next navigation begins
- All state transitions occur correctly
- Final state matches expected value
- All Page Object validations pass

**Edge Cases to Consider:**

- Rapid sequential navigation
- Network request queuing
- State consistency across multiple transitions

---

### 8. All Navigation Paths from Home State

**File**: `tests/navigation/all-paths-from-home.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. **Path 1**: Dispatch `NAVIGATE_TO_DOCS`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to home
5. **Path 2**: Dispatch `NAVIGATE_TO_API`
   - Assert state: `expect(executor.currentStateValue).toBe("api")`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to home

**Expected Results:**

- All navigation paths from home work correctly
- State transitions match expected values
- Page Object validations pass for each path

**Edge Cases to Consider:**

- Multiple paths from same starting state
- State machine correctly handles different target states

---

### 9. All Navigation Paths from Docs Overview State

**File**: `tests/navigation/all-paths-from-docs-overview.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `DocsOverviewPage`, `GettingStartedPage`, `ApiPage`, `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
4. Validate docs overview state: `await executor.validateCurrentState()`
5. **Path 1**: Dispatch `NAVIGATE_TO_GETTING_STARTED`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to docs overview
6. **Path 2**: Dispatch `NAVIGATE_TO_API`
   - Assert state: `expect(executor.currentStateValue).toBe("api")`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to docs overview
7. **Path 3**: Dispatch `NAVIGATE_TO_HOME`
   - Assert state: `expect(executor.currentStateValue).toBe("home")`
   - Validate state: `await executor.validateCurrentState()`

**Expected Results:**

- All navigation paths from docs overview work correctly
- State transitions match expected values
- Page Object validations pass for each path

**Edge Cases to Consider:**

- Navigation to sibling states
- Navigation to parent state
- Navigation to unrelated states

---

### 10. All Navigation Paths from Getting Started State

**File**: `tests/navigation/all-paths-from-getting-started.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `GettingStartedPage`, `DocsOverviewPage`, `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
4. Dispatch navigation to getting started: `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
5. Validate getting started state: `await executor.validateCurrentState()`
6. **Path 1**: Dispatch `NAVIGATE_TO_OVERVIEW`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to getting started
7. **Path 2**: Dispatch `NAVIGATE_TO_HOME`
   - Assert state: `expect(executor.currentStateValue).toBe("home")`
   - Validate state: `await executor.validateCurrentState()`

**Expected Results:**

- All navigation paths from getting started work correctly
- State transitions match expected values
- Page Object validations pass for each path

**Edge Cases to Consider:**

- Navigation to sibling state (overview)
- Navigation to root state (home)
- Event bubbling from child to parent

---

### 11. All Navigation Paths from API State

**File**: `tests/navigation/all-paths-from-api.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `ApiPage`, `DocsOverviewPage`, `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to API: `await executor.dispatch("NAVIGATE_TO_API")`
4. Validate API state: `await executor.validateCurrentState()`
5. **Path 1**: Dispatch `NAVIGATE_TO_DOCS`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
   - Validate state: `await executor.validateCurrentState()`
   - Navigate back to API
6. **Path 2**: Dispatch `NAVIGATE_TO_HOME`
   - Assert state: `expect(executor.currentStateValue).toBe("home")`
   - Validate state: `await executor.validateCurrentState()`

**Expected Results:**

- All navigation paths from API work correctly
- State transitions match expected values
- Page Object validations pass for each path

**Edge Cases to Consider:**

- Navigation to parent state (docs)
- Navigation to root state (home)
- State machine correctly resolves `#docs` reference

---

### 12. Event Bubbling from Child to Parent State

**File**: `tests/event-bubbling/bubbling-behavior.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `GettingStartedPage`, `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
4. Dispatch navigation to getting started: `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
5. Assert nested state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
6. Validate getting started state: `await executor.validateCurrentState()`
7. Dispatch `NAVIGATE_TO_HOME` event (defined in parent `docs` state, not in child)
8. Verify event bubbles up to parent state handler
9. Assert state transitions to home: `expect(executor.currentStateValue).toBe("home")`
10. Validate home state: `await executor.validateCurrentState()`

**Expected Results:**

- Event bubbles correctly from child to parent state
- State transitions correctly to `home`
- Page Object validation confirms home page is displayed
- Event handling works even when event not defined in child state

**Edge Cases to Consider:**

- Event defined only in parent state
- Event defined in both parent and child states
- Event bubbling order and precedence

---

### 13. Event Bubbling for NAVIGATE_TO_API from Docs States

**File**: `tests/event-bubbling/api-navigation-bubbling.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `DocsOverviewPage`, `GettingStartedPage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Dispatch navigation to docs: `await executor.dispatch("NAVIGATE_TO_DOCS")`
4. Assert state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
5. Dispatch `NAVIGATE_TO_API` (defined in both child `docs.overview` and parent `docs`)
6. Verify event handling works correctly
7. Assert API state: `expect(executor.currentStateValue).toBe("api")`
8. Navigate back to docs overview
9. Navigate to getting started: `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
10. Assert state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
11. Dispatch `NAVIGATE_TO_API` (should bubble to parent `docs` state)
12. Verify state transitions correctly to API
13. Assert API state: `expect(executor.currentStateValue).toBe("api")`
14. Validate API state: `await executor.validateCurrentState()`

**Expected Results:**

- Event bubbling works when event defined in parent state
- Event handling works when event defined in both parent and child
- State transitions correctly in both scenarios
- Page Object validations pass

**Edge Cases to Consider:**

- Event precedence (child vs parent)
- Event bubbling through multiple levels
- State resolution during event bubbling

---

### 14. State Persistence Across Multiple Transitions

**File**: `tests/state-persistence/persistence-tests.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: All Page Objects

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Assert initial state: `expect(executor.currentStateValue).toBe("home")`
5. Navigate: `home` → `docs.overview`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
   - Validate state: `await executor.validateCurrentState()`
6. Navigate: `docs.overview` → `docs.gettingStarted`
   - Assert state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
   - Validate state: `await executor.validateCurrentState()`
7. Navigate: `docs.gettingStarted` → `api`
   - Assert state: `expect(executor.currentStateValue).toBe("api")`
   - Validate state: `await executor.validateCurrentState()`
8. Navigate: `api` → `home`
   - Assert state: `expect(executor.currentStateValue).toBe("home")`
   - Validate state: `await executor.validateCurrentState()`
9. Verify no state corruption occurred
10. Verify all intermediate states were valid

**Expected Results:**

- State values match expected at each step
- No state corruption occurs across transitions
- All Page Object validations pass
- State machine maintains consistency

**Edge Cases to Consider:**

- State value persistence
- Context persistence (if applicable)
- State machine internal state consistency

---

### 15. Rapid State Transitions

**File**: `tests/state-persistence/rapid-transitions.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: All Page Objects

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Perform rapid sequential transitions:
   - `await executor.dispatch("NAVIGATE_TO_DOCS")`
   - `await executor.dispatch("NAVIGATE_TO_GETTING_STARTED")`
   - `await executor.dispatch("NAVIGATE_TO_OVERVIEW")`
   - `await executor.dispatch("NAVIGATE_TO_API")`
   - `await executor.dispatch("NAVIGATE_TO_HOME")`
5. Verify each transition completes before next begins
6. Assert final state: `expect(executor.currentStateValue).toBe("home")`
7. Validate final state: `await executor.validateCurrentState()`
8. Verify all intermediate states were valid

**Expected Results:**

- Each transition completes before next begins
- Final state is correct
- All intermediate states were valid
- No race conditions occur
- Page Object validations pass

**Edge Cases to Consider:**

- Transition timing
- Network request queuing
- State machine queue handling
- Race condition prevention

---

### 16. Return to Previous State

**File**: `tests/state-persistence/return-to-previous-state.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`, `GettingStartedPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Navigate forward: `home` → `docs.overview` → `docs.gettingStarted`
4. Assert current state: `expect(executor.currentStateValue).toEqual({ docs: "gettingStarted" })`
5. Navigate back: `docs.gettingStarted` → `docs.overview`
6. Assert state returns correctly: `expect(executor.currentStateValue).toEqual({ docs: "overview" })`
7. Validate state: `await executor.validateCurrentState()`
8. Verify page content matches expected state
9. Verify network requests are made appropriately

**Expected Results:**

- State returns correctly to previous state
- Page content matches expected state
- Network requests are made appropriately
- Page Object validation confirms correct page

**Edge Cases to Consider:**

- State history tracking
- Page content consistency
- Network request caching

---

### 17. Invalid Event Dispatch Handling

**File**: `tests/edge-cases/invalid-transitions.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Assert initial state: `expect(executor.currentStateValue).toBe("home")`
5. Attempt to dispatch an event not defined for `home` state (e.g., `NAVIGATE_TO_GETTING_STARTED`)
6. Verify state machine handles it gracefully (should not transition)
7. Assert current state remains unchanged: `expect(executor.currentStateValue).toBe("home")`
8. Verify no errors are thrown (or appropriate error handling)
9. Validate state still valid: `await executor.validateCurrentState()`

**Expected Results:**

- Invalid events are ignored by state machine
- State remains unchanged
- No errors are thrown (or graceful error handling)
- Current state remains valid

**Edge Cases to Consider:**

- Event not defined in current state
- Event not defined anywhere in machine
- Error handling for invalid events
- State machine resilience

---

### 18. State Validation Failure Handling

**File**: `tests/edge-cases/validation-failure.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Manually modify page to invalidate state (e.g., change URL via `page.goto()`)
5. Attempt to validate state: `await executor.validateCurrentState()`
6. Verify validation fails appropriately
7. Verify error message is descriptive
8. Verify state machine state is not corrupted

**Expected Results:**

- Validation fails when page state doesn't match expected state
- Error message is descriptive and helpful
- State machine state is not corrupted
- Test can recover from validation failure

**Edge Cases to Consider:**

- URL mismatch
- Page content mismatch
- Element visibility issues
- Network errors affecting page state

---

### 19. Network Request Failure Handling

**File**: `tests/edge-cases/network-failure.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Set up network interception to simulate request failure: `await page.route('**/docs', route => route.abort())`
5. Attempt navigation: `await executor.dispatch("NAVIGATE_TO_DOCS")`
6. Verify appropriate error handling
7. Verify state machine handles failure gracefully
8. Verify current state remains valid or transitions appropriately

**Expected Results:**

- Network failures are handled gracefully
- Appropriate error messages are provided
- State machine state is not corrupted
- Test can recover from network failure

**Edge Cases to Consider:**

- Network timeout
- Request abort
- Response errors (4xx, 5xx)
- Connection failures

---

### 20. Concurrent Navigation Attempts

**File**: `tests/edge-cases/concurrent-navigation.spec.ts`

**XState Machine**: `playwrightDevMachine`

**Page Objects**: `HomePage`, `DocsOverviewPage`, `ApiPage`

**Steps:**

1. Create ModelExecutor with playwrightDevMachine and factory
2. Navigate to `https://playwright.dev`
3. Validate initial state: `await executor.validateCurrentState()`
4. Start navigation to docs: `const nav1 = executor.dispatch("NAVIGATE_TO_DOCS")`
5. Immediately attempt navigation to API: `const nav2 = executor.dispatch("NAVIGATE_TO_API")`
6. Wait for both promises: `await Promise.all([nav1, nav2])`
7. Verify only one navigation completes
8. Verify final state is correct
9. Verify state machine handled concurrent attempts appropriately

**Expected Results:**

- Only one navigation completes
- Final state is correct
- State machine handles concurrent attempts appropriately
- No state corruption occurs

**Edge Cases to Consider:**

- Race conditions
- State machine queue handling
- Navigation cancellation
- State consistency

---

## Implementation Notes

### Network Request Validation Pattern

All network request tests should follow this pattern:

```typescript
test("navigation triggers network request", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, playwrightDevMachine, factory);

  await page.goto("https://playwright.dev");
  await executor.validateCurrentState();

  // Set up network listeners BEFORE dispatching event
  const requestPromise = page.waitForRequest(
    (request) => request.url().includes("/docs") && request.method() === "GET"
  );
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/docs") && response.status() === 200
  );

  // Dispatch event and wait for network requests
  await Promise.all([executor.dispatch("NAVIGATE_TO_DOCS"), requestPromise, responsePromise]);

  // Verify state transition
  expect(executor.currentStateValue).toEqual({ docs: "overview" });
  await executor.validateCurrentState();
});
```

### Test Organization

Tests should be organized into logical categories:

- `tests/navigation/` - Navigation flow tests
- `tests/network/` - Network request validation tests
- `tests/event-bubbling/` - Event bubbling behavior tests
- `tests/state-persistence/` - State persistence tests
- `tests/validation/` - State validation tests
- `tests/edge-cases/` - Edge case and error handling tests

### Best Practices

1. **Always validate state after transitions**: Use `await executor.validateCurrentState()`
2. **Assert state values**: Use `expect(executor.currentStateValue).toBe(...)` or `.toEqual(...)`
3. **Set up network listeners before dispatching**: Prevent race conditions
4. **Use Promise.all for concurrent operations**: Ensure proper timing
5. **Keep tests independent**: Each test should be runnable in isolation
6. **Use descriptive test names**: Clearly indicate what is being tested
7. **Include edge case considerations**: Document potential issues

## Success Criteria

- ✅ All state transitions have corresponding tests
- ✅ Network requests are validated for all navigation actions
- ✅ Event bubbling is verified for all applicable scenarios
- ✅ Edge cases are handled gracefully
- ✅ Tests are independent and can run in any order
- ✅ Test execution time remains reasonable
- ✅ All tests pass consistently
- ✅ Code follows TypeScript best practices
- ✅ Tests are maintainable and well-documented
