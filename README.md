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

**Note**: The library automatically supports both XState v4 and v5. No code changes needed when upgrading XState versions.

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

**Option A: Using convenience helper (recommended for reduced boilerplate)**

```typescript
import { test, expect } from "@playwright/test";
import { createExecutor } from "playwright-state-model";
import { appMachine } from "./machine";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";

test("navigate through states", async ({ page }) => {
  const executor = createExecutor(page, appMachine, (factory) => {
    factory.register("home", HomePage);
    factory.register("dashboard", DashboardPage);
  });

  await page.goto("https://example.com");
  await executor.expectState("home");

  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  await executor.expectState("dashboard");
});
```

**Option B: Traditional setup (more explicit)**

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

## XState Version Support

**Full XState v4 and v5 Compatibility**: The library automatically detects and supports both XState v4 (`interpret`) and v5 (`createActor`) APIs. No code changes needed when upgrading XState versions - the library handles version detection automatically.

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

## Best Practices

### When to Use State Model vs Direct Navigation

**Use State Model (`dispatch()` / `navigateAndValidate()`) when:**

- ✅ Testing navigation flows and state transitions
- ✅ Verifying state machine correctness
- ✅ Testing complex multi-page workflows
- ✅ You want automatic state validation after transitions
- ✅ You need to ensure state consistency across tests

**Use Direct Navigation (`page.goto()` / `pageObject.goto()`) when:**

- ✅ Testing a single page in isolation
- ✅ API-only tests (no UI state)
- ✅ Performance-critical tests where state validation overhead isn't needed
- ✅ Testing page-specific functionality that doesn't involve navigation

**Example: State transitions (recommended for navigation tests)**

```typescript
// ✅ Good: Uses state machine for navigation
await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
await executor.expectState("dashboard");
```

**Example: Direct navigation (acceptable for single-page tests)**

```typescript
// ✅ Also fine: Direct navigation for simple page tests
await app.dashboard.goto();
await app.dashboard.waitForLoad();
```

### Reducing Boilerplate

Use `createExecutor()` helper to reduce setup code:

```typescript
// Before: 3 lines
const factory = createStateFactory(page);
const executor = new ModelExecutor(page, appMachine, factory);

// After: 1 line
const executor = createExecutor(page, appMachine, (factory) => {
  factory.register("home", HomePage);
  factory.register("dashboard", DashboardPage);
});
```

### Convenience Methods

Use `navigateAndValidate()` and `expectState()` for cleaner test code:

```typescript
// Before: 2 lines
await executor.dispatch("NAVIGATE_TO_DASHBOARD");
await executor.validateCurrentState();
expect(executor.currentStateValue).toBe("dashboard");

// After: 1 line
await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
await executor.expectState("dashboard");
```

### State-Driven Navigation

Use `gotoState()` for state-machine-aware navigation instead of direct `goto()` calls:

```typescript
// Instead of direct navigation:
await app.dashboard.goto();
await executor.expectState("dashboard");

// Use state-driven navigation:
await executor.gotoState("dashboard");
await executor.expectState("dashboard");
```

**Note**: `gotoState()` navigates to the page but doesn't update the state machine. For state transitions, use `navigateAndValidate()` instead.

### State Synchronization

Use `syncStateFromPage()` to detect state mismatches when navigation happens outside the state machine:

```typescript
// Direct URL change (bypasses state machine)
await page.goto("https://example.com/dashboard");

// Detect if state machine is out of sync
try {
  await executor.syncStateFromPage();
  await executor.expectState("dashboard");
} catch (error) {
  // State machine needs updating - use navigateAndValidate() instead
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
}
```

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
    await expect(this.page.locator(`[data-user-id="${this.context.userId}"]`)).toBeVisible();
  }
}
```

### Complete Example

See the [`example/`](./example/) directory for a complete working example testing [playwright.dev](https://playwright.dev). The example includes:

- Comprehensive test coverage with 38 tests
- Test helpers and constants for maintainability
- Parallelism-safe test design
- Race condition prevention patterns

## AI Agents

**playwright-state-model** includes AI agents to help you build, maintain, and debug model-based tests:

- **🎯 Planner** - Creates comprehensive test plans using XState and Page Objects
- **⚡ Generator** - Generates complete test implementations from plans with parallelism safety
- **🔧 Healer** - Automatically fixes failing tests and verifies parallelism safety
- **🏗️ Module Builder** - Helps develop and maintain the module itself

All agents are designed to ensure tests are **parallelism-safe** and **race condition-free**, automatically verifying tests pass with `--repeat-each 10 --workers 5`.

### Getting Started with Agents

Initialize agent definitions in your project:

```bash
# For VS Code
npx playwright-state-model init-agents --loop=vscode

# For Claude Desktop
npx playwright-state-model init-agents --loop=claude

# For OpenCode
npx playwright-state-model init-agents --loop=opencode
```

This creates agent definitions in `.vscode/agents/`, `.claude/agents/`, or `.opencode/agents/` depending on your chosen environment.

See the [`agents/`](./agents/) directory for agent definitions and documentation.

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
- `getRegisteredStates(): string[]` - Returns array of all registered state IDs

### `ModelExecutor`

Orchestrates state machine execution and Page Object validation. The main entry point for model-based testing.

**Methods:**

- `validateCurrentState(): Promise<void>` - Validates the entire state hierarchy with detailed error messages
- `dispatch(event: string, payload?: any): Promise<void>` - Dispatches an event and validates the new state
- `navigateAndValidate(event: string, payload?: any): Promise<void>` - Convenience method: dispatches event and validates state
- `expectState(expectedState: any, options?: { strict?: boolean }): Promise<void>` - Validates current state and asserts it matches expected value
- `gotoState(targetState: any): Promise<void>` - Navigate directly to a target state through Page Object's `goto()` method (state-machine-aware navigation)
- `syncStateFromPage(): Promise<void>` - Detect current page state and verify state machine synchronization
- `dispose(): void` - Cleans up resources (XState interpreter/actor)

**Properties:**

- `currentStateValue` - Returns the current XState value

### `createExecutor`

Convenience function to reduce boilerplate when creating ModelExecutor instances.

**Function:**

- `createExecutor(page: Page, machine: AnyStateMachine, factoryCreator: (factory: StateFactory) => void): ModelExecutor` - Creates and configures a ModelExecutor in one call

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
   git clone https://github.com/gustavo-meilus/playwright-state-model.git
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
- [Usage Guide](./USAGE_GUIDE.md) - Best practices and when to use state model
- [AI Agents](./agents/)
- [API Reference](#api-reference)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
