# 🎭 Playwright State Model

Model-Based Testing driver connecting XState state machines with Playwright Page Objects.

[![npm version](https://img.shields.io/npm/v/playwright-state-model)](https://www.npmjs.com/package/playwright-state-model)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Playwright State Model** bridges the gap between formal state machine specifications and end-to-end testing. Write maintainable, scalable tests by modeling your application's behavior with XState and validating it with Playwright.

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
import { createMachine } from "xstate";

export const appMachine = createMachine({
  id: "app",
  initial: "home",
  states: {
    home: {
      id: "home",
      on: {
        NAVIGATE_TO_DASHBOARD: { target: "dashboard" },
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

### 2. Create Page Objects

```typescript
import { Page, expect } from "@playwright/test";
import { BaseState } from "playwright-state-model";

export class HomePage extends BaseState {
  constructor(page: Page, context?: any) {
    super(page, context);
  }

  async validateState(): Promise<void> {
    await expect(this.page).toHaveURL("https://example.com");
    await expect(this.page.locator("h1")).toBeVisible();
  }

  async NAVIGATE_TO_DASHBOARD(): Promise<void> {
    await this.page.getByRole("link", { name: "Dashboard" }).click();
  }
}
```

### 3. Register States

```typescript
import { Page } from "@playwright/test";
import { StateFactory } from "playwright-state-model";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";

export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);
  factory.register("home", HomePage);
  factory.register("dashboard", DashboardPage);
  return factory;
}
```

### 4. Use ModelExecutor in Tests

```typescript
import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "./machine";
import { createStateFactory } from "./factory";

test("navigate through states", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);

  await page.goto("https://example.com");
  await executor.validateCurrentState();

  await executor.dispatch("NAVIGATE_TO_DASHBOARD");
  expect(executor.currentStateValue).toBe("dashboard");
});
```

## Capabilities

### Hierarchical State Resolution • Automatic Composition

**Nested state mapping**. Automatically resolves complex nested XState states to Page Object chains. Define hierarchical states once and validate entire UI compositions automatically.

```typescript
// XState: { docs: { overview: {} } }
// Automatically resolves to: [DocsPage, DocsOverviewPage]
// Validates both parent and child states
```

### Event Bubbling • Bottom-Up Traversal

**Smart event dispatch**. Events bubble from leaf states to root, ensuring the most specific handler executes first. Matches how modern web applications handle events.

```typescript
// Event 'NAVIGATE_TO_HOME' bubbles from:
// GettingStartedPage → DocsPage → AppPage
// First handler found executes
```

### State Validation • Top-Down Composition

**Complete UI validation**. Validates entire state hierarchy from root to leaf, ensuring parent components are validated before children. Guarantees consistent UI state.

### Context Injection • Data-Driven Testing

**XState context integration**. Automatically injects XState context into Page Objects, enabling data-driven testing scenarios without manual state management.

### Type-Safe • Full TypeScript Support

**Complete type inference**. Full TypeScript support with proper type inference for state machines, Page Objects, and context data.

## Examples

### Hierarchical States

Test complex nested state machines with automatic resolution:

```typescript
const machine = createMachine({
  id: "app",
  states: {
    docs: {
      id: "docs",
      initial: "overview",
      states: {
        overview: { id: "docs.overview" },
        gettingStarted: { id: "docs.gettingStarted" },
      },
    },
  },
});

// Automatically resolves and validates:
// - docs state → DocsPage
// - docs.overview state → DocsOverviewPage
```

### Context-Driven Testing

Use XState context for data-driven scenarios:

```typescript
const machine = createMachine({
  context: { userId: null },
  // ... states
});

class UserDashboard extends BaseState<{ userId: string }> {
  async validateState(): Promise<void> {
    await expect(
      this.page.locator(`[data-user-id="${this.context.userId}"]`)
    ).toBeVisible();
  }
}
```

### Complete Example

See the [`example/`](./example/) directory for a complete working example testing [playwright.dev](https://playwright.dev).

## API Reference

### `BaseState<TContext>`

Abstract base class for all Page Objects. Extend this class to create state-specific Page Objects.

**Methods:**

- `validateState(): Promise<void>` - Must be implemented to assert the current page state

**Properties:**

- `context: TContext` - Injected XState context data
- `protected page: Page` - Playwright Page instance

### `StateFactory`

Maps XState state IDs to Page Object classes. Manages the registry of state-to-PageObject mappings.

**Methods:**

- `register(id: string, stateClass: StateConstructor): void` - Register a state mapping
- `get<T extends BaseState>(id: string, context: any): T` - Create a Page Object instance

### `ModelExecutor`

Orchestrates state machine execution and Page Object validation. The main entry point for model-based testing.

**Methods:**

- `validateCurrentState(): Promise<void>` - Validates the entire state hierarchy
- `dispatch(event: string, payload?: any): Promise<void>` - Dispatches an event and validates the new state

**Properties:**

- `currentStateValue` - Returns the current XState value

### `ActionLocator<TNext>`

Smart locator that binds UI elements to actions and transitions. Useful for complex interactions with side effects.

**Methods:**

- `perform(action, ...args): Promise<TNext>` - Executes action and handles side effects
- `get raw: Locator` - Exposes the underlying Playwright Locator

## Contributing

We welcome contributions! This project follows best practices for open source development.

### Development Setup

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/your-username/playwright-state-model.git
   cd playwright-state-model
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the project**:

   ```bash
   npm run build
   ```

4. **Run tests** (in the example directory):
   ```bash
   cd example
   npm install
   npm test
   ```

### Making Changes

1. **Create a branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the existing code style:

   - Use TypeScript with strict mode
   - Follow existing naming conventions
   - Add JSDoc comments for public APIs
   - Keep code simple and maintainable

3. **Test your changes**:

   - Ensure the build succeeds: `npm run build`
   - Run example tests: `cd example && npm test`
   - Test your changes manually if needed

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   # or
   git commit -m "fix: fix your bug description"
   ```

   Use conventional commit messages:

   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test additions/changes
   - `chore:` for maintenance tasks

### Submitting Changes

1. **Push your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all checks pass

### Code Style

- **TypeScript**: Use strict mode, prefer `async/await` over promises
- **Naming**: Use PascalCase for classes, camelCase for functions/variables
- **Documentation**: Add JSDoc comments for all public APIs
- **Testing**: Maintain or improve test coverage

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/gustavo-meilus/playwright-state-model/issues) with:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (Node version, Playwright version, etc.)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [XState Documentation](https://xstate.js.org)
- [Example Project](./example/)
- [API Reference](#api-reference)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
