# Playwright XState Driver

Model-Based Testing driver connecting XState state machines with Playwright Page Objects.

## Features

- **Hierarchical State Resolution**: Automatically resolves nested XState states to Page Object chains
- **Event Bubbling**: Dispatches events using bottom-up traversal (Leaf → Root)
- **State Validation**: Validates entire UI composition top-down (Root → Leaf)
- **Context Injection**: Injects XState context into Page Objects for data-driven testing
- **Type-Safe**: Full TypeScript support with proper type inference

## Installation

```bash
npm install playwright-state-model
```

**Peer Dependencies:**
- `@playwright/test`: ^1.30.0
- `xstate`: ^4.30.0 || ^5.0.0

## Quick Start

### 1. Define Your XState Machine

```typescript
import { createMachine } from 'xstate';

export const appMachine = createMachine({
  id: 'app',
  initial: 'home',
  states: {
    home: {
      id: 'home',
      on: {
        NAVIGATE_TO_DASHBOARD: { target: 'dashboard' },
      },
    },
    dashboard: {
      id: 'dashboard',
      on: {
        NAVIGATE_TO_HOME: { target: 'home' },
      },
    },
  },
});
```

### 2. Create Page Objects

```typescript
import { Page, expect } from '@playwright/test';
import { BaseState } from 'playwright-state-model';

export class HomePage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL('https://example.com');
    await expect(this.page.locator('h1')).toBeVisible();
  }

  async NAVIGATE_TO_DASHBOARD(): Promise<void> {
    await this.page.getByRole('link', { name: 'Dashboard' }).click();
  }
}
```

### 3. Register States

```typescript
import { StateFactory } from 'playwright-state-model';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';

export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);
  factory.register('home', HomePage);
  factory.register('dashboard', DashboardPage);
  return factory;
}
```

### 4. Use ModelExecutor in Tests

```typescript
import { test } from '@playwright/test';
import { ModelExecutor } from 'playwright-state-model';
import { appMachine } from './machine';
import { createStateFactory } from './factory';

test('navigate through states', async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);

  await page.goto('https://example.com');
  await executor.validateCurrentState();

  await executor.dispatch('NAVIGATE_TO_DASHBOARD');
  expect(executor.currentStateValue).toBe('dashboard');
});
```

## Example Project

See the `example/` directory for a complete working example testing playwright.dev.

## API Reference

### `BaseState<TContext>`

Abstract base class for all Page Objects.

- `validateState()`: Must be implemented to assert the current page state
- `context`: Injected XState context data

### `StateFactory`

Maps XState state IDs to Page Object classes.

- `register(id: string, stateClass: StateConstructor)`: Register a state mapping
- `get<T>(id: string, context: any): T`: Create a Page Object instance

### `ModelExecutor`

Orchestrates state machine execution and Page Object validation.

- `validateCurrentState()`: Validates the entire state hierarchy
- `dispatch(event: string, payload?: any)`: Dispatches an event and validates
- `currentStateValue`: Returns the current XState value

### `ActionLocator<TNext>`

Smart locator that binds UI elements to actions and transitions.

- `perform(action, ...args)`: Executes action and handles side effects
- `raw`: Exposes the underlying Playwright Locator

## License

MIT
