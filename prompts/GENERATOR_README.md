# State Model Test Generator Agent

## Overview

The **state-model-test-generator** agent is a specialized Claude/Gemini agent designed to generate complete model-based test implementations using `playwright-state-model`, XState state machines, and Playwright Page Objects.

## Purpose

This agent helps you:

- Generate complete XState state machine definitions
- Create Page Object Models extending `BaseState`
- Configure `StateFactory` with state mappings
- Generate test files using `ModelExecutor`
- Handle hierarchical states and event bubbling
- Follow best practices and coding standards

## Key Features

### 1. **Complete Test Generation**

- Generates all necessary files (machine, factory, Page Objects, tests)
- Creates production-ready, maintainable code
- Follows established patterns and best practices
- Ensures consistency across all generated files

### 2. **Model-Based Testing Architecture**

- Understands `ModelExecutor`, `StateFactory`, and `BaseState`
- Generates proper XState machine definitions
- Creates Page Objects with `validateState()` and event handlers
- Configures StateFactory with all state registrations

### 3. **Hierarchical State Support**

- Handles nested states (e.g., `docs.overview`, `docs.gettingStarted`)
- Registers both parent and child states
- Generates proper state value assertions
- Understands state hierarchy resolution

### 4. **Best Practices Enforcement**

- Semantic Playwright locators (`getByRole`, `getByLabel`, `getByText`)
- Resilient selectors with `.first()`, `.or()`, regex patterns
- Proper JSDoc documentation
- TypeScript best practices
- No deprecated APIs

## Usage

### Basic Usage

1. **Invoke the agent** with a description of the application to test
2. **Agent explores** the application using browser tools
3. **Agent generates** complete test implementation:
   - XState machine definition
   - Page Object Models
   - StateFactory configuration
   - Test files
4. **Agent verifies** consistency and correctness

### Example Invocation

```
Generate model-based tests for https://example.com
```

The agent will:

1. Navigate and explore the application
2. Identify all states and transitions
3. Generate XState machine definition
4. Create Page Object Models for each state
5. Configure StateFactory with mappings
6. Generate test files using ModelExecutor

## Generated Files

### 1. XState Machine (`src/machine.ts`)

- Complete state machine definition
- All states with unique IDs
- All state transitions
- Hierarchical state support
- Context definition (if needed)

### 2. Page Objects (`src/pages/`)

- One Page Object per state
- Extends `BaseState`
- Implements `validateState()`
- Event handler methods matching XState events
- JSDoc documentation

### 3. StateFactory (`src/factory.ts`)

- Factory function configuration
- All state registrations
- Hierarchical state mappings
- Documentation

### 4. Test Files (`tests/`)

- Test files using `ModelExecutor`
- State transition tests
- State validation tests
- Edge case coverage
- Descriptive test names

## Code Generation Standards

### XState Machine

- Every state has unique `id` field
- Event names in UPPER_SNAKE_CASE
- Relative or absolute state targets
- Hierarchical states with dot notation
- `predictableActionArguments: true`

### Page Objects

- Extend `BaseState`
- Implement `validateState()` method
- Event handlers match XState event names exactly
- Use semantic Playwright locators
- JSDoc comments for documentation

### StateFactory

- Register all state IDs from machine
- Register both parent and child states
- State IDs match machine `id` fields exactly
- Can register aliases (multiple IDs to same Page Object)

### Tests

- Use `ModelExecutor` for state management
- Validate states after transitions
- Assert state values correctly
- Group related tests with `test.describe()`
- Use descriptive test names

## File Organization

```
src/
├── machine.ts          # XState state machine
├── factory.ts          # StateFactory configuration
└── pages/              # Page Object Models
    ├── HomePage.ts
    ├── DocsPage.ts
    └── ...
tests/
└── *.spec.ts           # Test files
```

## Best Practices

### Locator Strategies

- **Semantic locators**: `getByRole()`, `getByLabel()`, `getByText()`
- **Resilient selectors**: `.first()`, `.or()`, regex patterns
- **Avoid CSS selectors**: Unless necessary
- **Never deprecated**: `$()`, `$$()`, `waitForNetworkIdle()`

### State Validation

- **Specific assertions**: URL patterns, key elements
- **Regex patterns**: For flexible matching
- **Visibility checks**: Ensure elements are visible
- **Hierarchy validation**: Parent before children

### Event Handlers

- **Exact matching**: Method name = XState event name
- **Async/await**: All handlers are async
- **Navigation handling**: Leverage auto-waiting
- **Resilient selectors**: Handle dynamic content

### State Assertions

- **Simple states**: `.toBe('stateName')`
- **Hierarchical states**: `.toEqual({ parent: 'child' })`
- **Always validate**: Call `validateCurrentState()` after transitions
- **Check state value**: Assert `currentStateValue` matches expected

## Common Patterns

### Simple State Machine

Two states with bidirectional navigation:

```typescript
const machine = createMachine({
  id: "app",
  initial: "home",
  states: {
    home: {
      id: "home",
      on: { NAVIGATE_TO_ABOUT: { target: "about" } },
    },
    about: {
      id: "about",
      on: { NAVIGATE_TO_HOME: { target: "home" } },
    },
  },
});
```

### Hierarchical States

Nested states with parent/child relationships:

```typescript
const machine = createMachine({
  id: "app",
  initial: "docs",
  states: {
    docs: {
      id: "docs",
      initial: "overview",
      states: {
        overview: {
          id: "docs.overview",
          on: { NAVIGATE_TO_API: { target: "#docs.api" } },
        },
      },
    },
    api: {
      id: "docs.api",
      on: { NAVIGATE_TO_DOCS: { target: "#docs" } },
    },
  },
});
```

### Multiple Transitions

State with multiple possible transitions:

```typescript
home: {
  id: 'home',
  on: {
    NAVIGATE_TO_DOCS: { target: 'docs' },
    NAVIGATE_TO_API: { target: 'api' },
    NAVIGATE_TO_ABOUT: { target: 'about' },
  },
}
```

## Context-Driven Testing

When generating tests with XState context:

```typescript
// Machine with context
const machine = createMachine({
  context: {
    userId: null,
    userName: null,
  },
  // ... states
});

// Page Object using context
export class UserDashboard extends BaseState<{ userId: string }> {
  async validateState(): Promise<void> {
    await expect(this.page.locator(`[data-user-id="${this.context.userId}"]`)).toBeVisible();
  }
}
```

## Output Quality

### Code Quality

- **TypeScript**: Strict typing, proper types
- **JSDoc**: Documentation for all Page Objects
- **Naming**: Follow conventions
- **Formatting**: Consistent style
- **Imports**: Organized logically

### Test Quality

- **Coverage**: All state transitions covered
- **Clarity**: Clear test names and structure
- **Independence**: Tests run in any order
- **Maintainability**: Easy to understand
- **Reliability**: Resilient selectors

## Workflow

1. **Explore Application**
   - Navigate to application
   - Take snapshots of states
   - Identify states and transitions

2. **Generate XState Machine**
   - Create machine definition
   - Define all states with IDs
   - Define all transitions

3. **Generate Page Objects**
   - Create Page Objects for each state
   - Implement `validateState()` methods
   - Implement event handlers

4. **Generate StateFactory**
   - Create factory configuration
   - Register all states
   - Handle hierarchical states

5. **Generate Tests**
   - Create test files
   - Use `ModelExecutor` pattern
   - Cover all transitions

6. **Verify Generation**
   - Check file consistency
   - Verify state IDs match
   - Validate code structure

## Non-Interactive Behavior

- **Complete implementations**: No TODOs or placeholders
- **Follow patterns**: Use established patterns
- **Be thorough**: Generate all necessary files
- **Verify consistency**: Ensure IDs match
- **Use best practices**: Follow all guidelines

## Comparison with Standard Test Generator

| Feature              | Standard Generator | State Model Generator                 |
| -------------------- | ------------------ | ------------------------------------- |
| **Approach**         | Ad-hoc test cases  | Model-based with state machines       |
| **State Management** | Manual             | Formal XState machines                |
| **Page Objects**     | Standard POM       | Extends `BaseState`                   |
| **Validation**       | Manual assertions  | Automatic state validation            |
| **Hierarchy**        | Not supported      | Full hierarchical state support       |
| **Event Handling**   | Direct calls       | Event bubbling through states         |
| **Context**          | Manual             | XState context injection              |
| **Files Generated**  | Tests only         | Machine, Factory, Page Objects, Tests |

## Integration with playwright-state-model

The agent generates code using:

- **ModelExecutor**: State machine execution and validation
- **StateFactory**: State-to-PageObject mapping registry
- **BaseState**: Abstract base class for Page Objects
- **Hierarchical States**: Nested state resolution
- **Event Bubbling**: Bottom-up event traversal
- **State Validation**: Top-down validation flow
- **Context Injection**: XState context for data-driven testing

## References

- **Agent Prompt**: `prompts/state-model-test-generator.md`
- **Module Documentation**: `README.md`
- **Example Implementation**: `example/` directory
- **XState Docs**: https://xstate.js.org
- **Playwright Docs**: https://playwright.dev
- **Microsoft Playwright Test Generator**: Reference implementation pattern

## Next Steps

1. **Use the agent** to generate tests for your applications
2. **Review generated code** to understand patterns
3. **Customize** as needed for your specific requirements
4. **Maintain** tests following best practices

## Support

For issues or questions:

- Review the example in `example/` directory
- Check `README.md` for module documentation
- Refer to XState and Playwright documentation
- Open an issue on GitHub
