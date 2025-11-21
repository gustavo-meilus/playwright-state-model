# Playwright.dev Example - Model-Based Testing

This example demonstrates how to use `playwright-state-model` to test the Playwright.dev website using XState state machines and Page Object Models.

## Structure

```
example/
├── src/
│   ├── machine.ts          # XState state machine definition
│   ├── factory.ts          # StateFactory configuration
│   ├── constants.ts        # Centralized constants (URLs, states, events)
│   └── pages/              # Page Object Models
│       ├── HomePage.ts
│       ├── DocsPage.ts
│       ├── GettingStartedPage.ts
│       └── ApiPage.ts
└── tests/
    ├── helpers/
    │   └── test-setup.ts   # Test helper utilities
    ├── playwright-dev.spec.ts
    ├── navigation/         # Navigation flow tests
    ├── network/            # Network request validation tests
    ├── event-bubbling/     # Event bubbling behavior tests
    ├── state-persistence/  # State persistence tests
    ├── validation/         # State validation tests
    └── edge-cases/         # Edge case and error handling tests
```

## How It Works

1. **XState Machine** (`src/machine.ts`): Defines the application states and transitions
2. **Page Objects** (`src/pages/`): Extend `BaseState` and implement `validateState()` and event handlers
3. **StateFactory** (`src/factory.ts`): Maps XState state IDs to Page Object classes
4. **Tests** (`tests/`): Use `ModelExecutor` to dispatch events and validate states

## Running Tests

```bash
# Run tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests in headed mode
npm run test:headed

# Run tests with parallelism verification (stability check)
npx playwright test --repeat-each 10 --workers 5
```

## Code Quality Features

This example demonstrates best practices for model-based testing:

- **Constants**: Centralized constants in `src/constants.ts` for URLs, state values, and event names
- **Test Helpers**: Reusable test utilities in `tests/helpers/test-setup.ts` to reduce code duplication
- **Parallelism Safety**: All tests are designed to be completely isolated and safe for parallel execution
- **Race Condition Prevention**: Tests use Playwright's auto-waiting and avoid timing dependencies
- **SOLID Principles**: Page Objects follow Single Responsibility Principle and proper encapsulation
- **OOP Best Practices**: Clean inheritance hierarchy and proper abstraction

## State Machine Flow

```
home
  ├─ NAVIGATE_TO_DOCS → docs.overview
  └─ NAVIGATE_TO_API → docs.api

docs.overview
  ├─ NAVIGATE_TO_GETTING_STARTED → docs.gettingStarted
  ├─ NAVIGATE_TO_API → docs.api
  └─ NAVIGATE_TO_HOME → home

docs.gettingStarted
  ├─ NAVIGATE_TO_OVERVIEW → docs.overview
  └─ NAVIGATE_TO_HOME → home

docs.api
  ├─ NAVIGATE_TO_DOCS → docs
  └─ NAVIGATE_TO_HOME → home
```
