# Playwright.dev Example - Model-Based Testing

This example demonstrates how to use `playwright-state-model` to test the Playwright.dev website using XState state machines and Page Object Models.

## Structure

```
example/
├── src/
│   ├── machine.ts          # XState state machine definition
│   ├── factory.ts          # StateFactory configuration
│   └── pages/              # Page Object Models
│       ├── HomePage.ts
│       ├── DocsPage.ts
│       ├── GettingStartedPage.ts
│       └── ApiPage.ts
└── tests/
    └── playwright-dev.spec.ts  # Test file using ModelExecutor
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
```

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
