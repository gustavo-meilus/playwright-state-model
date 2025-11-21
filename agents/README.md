---
id: test-agents

title: "Agents"
---

# Playwright State Model Test Agents

## Introduction

**playwright-state-model** comes with four specialized AI agents designed to help you build, maintain, and debug model-based tests using XState state machines and Playwright Page Objects:

- **🎯 planner** - Creates comprehensive test plans for model-based testing
- **⚡ generator** - Generates complete test implementations from plans
- **🔧 healer** - Automatically fixes failing tests
- **🏗️ module-builder** - Helps develop and maintain the playwright-state-model module itself

These agents work together to provide a complete model-based testing workflow. They can be used independently, sequentially, or in combination to produce comprehensive test coverage for your application.

### Model-Based Testing Approach

Unlike traditional Playwright tests, these agents leverage **playwright-state-model**, which bridges formal XState state machines with Playwright Page Objects. This approach provides:

- **Hierarchical State Resolution**: Automatically resolves nested XState states to Page Object chains
- **Event Bubbling**: Events bubble from leaf states to root (bottom-up traversal)
- **State Validation**: Validates entire state hierarchy top-down (root to leaf)
- **Context Injection**: XState context automatically injected into Page Objects for data-driven testing
- **Type Safety**: Full TypeScript support with proper type inference

### Getting Started

To use these agents, you'll need:

1. **playwright-state-model** installed in your project
2. An AI tool that supports Claude/Gemini agents (VS Code, Claude Desktop, etc.)
3. Agent definitions from the `agents/` directory

The agents are designed to work with Claude Sonnet models and follow the standard agent format with frontmatter metadata.

## 🎯 Planner

The **planner** agent explores your application and produces comprehensive test plans using model-based testing principles.

**Purpose**: Create detailed test plans that leverage XState state machines and Page Object Models.

**Input**:

- A clear request to the planner (e.g., "Create a test plan for the navigation flow")
- Understanding of the target application or website
- (Optional) Existing XState machine definitions

**Agent File**: `state-model-test-planner.md`

**What It Does**:

1. **Explores and Analyzes** - Identifies all distinct application states (pages, views, modals, etc.)
2. **Designs XState Machine** - Creates comprehensive state machine definitions with hierarchical states
3. **Designs Page Object Models** - Maps each XState state to a corresponding Page Object
4. **Creates StateFactory Configuration** - Registers all state-to-PageObject mappings
5. **Designs Test Scenarios** - Creates detailed scenarios covering happy paths, edge cases, and state transitions

**Output**:

- A Markdown test plan (e.g., `specs/navigation-plan.md`)
- Complete XState machine definition
- Page Object Model specifications
- StateFactory configuration
- Detailed test scenarios with step-by-step instructions

**Example Usage**:

```
Create a model-based test plan for https://example.com
```

**Key Features**:

- Understands hierarchical states (`docs.overview`, `docs.gettingStarted`)
- Designs event bubbling patterns
- Creates state validation strategies
- Supports context-driven testing scenarios

## ⚡ Generator

The **generator** agent transforms test plans into executable Playwright tests using playwright-state-model.

**Purpose**: Generate complete, production-ready test implementations from test plans.

**Input**:

- Markdown test plan from planner (or manually created)
- Target application URL or existing application

**Agent File**: `state-model-test-generator.md`

**What It Does**:

1. **Explores Application** - Uses browser tools to understand UI structure
2. **Generates XState Machine** - Creates `src/machine.ts` with complete state definitions
3. **Generates Page Objects** - Creates Page Object classes extending `BaseState`
4. **Creates StateFactory** - Generates `src/factory.ts` with all state registrations
5. **Generates Test Files** - Creates test files using `ModelExecutor` pattern

**Output**:

- Complete XState machine definition (`src/machine.ts`)
- Page Object Models (`src/pages/*.ts`)
- StateFactory configuration (`src/factory.ts`)
- Test files (`tests/*.spec.ts`)

**Example Usage**:

```
Generate model-based tests for https://example.com based on the navigation plan
```

**Key Features**:

- Generates semantic Playwright locators (`getByRole`, `getByLabel`, `getByText`)
- Creates resilient selectors with fallbacks
- Implements proper state validation
- Handles hierarchical states correctly
- Follows all best practices automatically

## 🔧 Healer

The **healer** agent automatically debugs and fixes failing tests that use playwright-state-model.

**Purpose**: Systematically identify, diagnose, and fix broken model-based tests.

**Input**:

- Failing test name or test file
- Test execution results

**Agent File**: `state-model-test-healer.md`

**What It Does**:

1. **Runs Tests** - Identifies failing tests using `run_terminal_cmd` with `playwright test`
2. **Debugs Failures** - Uses `run_terminal_cmd` with `playwright test --debug` to pause at failure points
3. **Classifies Errors** - Categorizes failures into 7 types:
   - StateFactory Registration Errors
   - Page Object Validation Failures
   - Event Handler Not Found
   - State Value Assertion Failures
   - State Transition Failures
   - Hierarchical State Resolution Issues
   - Context Injection Problems
4. **Fixes Issues** - Updates code systematically
5. **Verifies Fixes** - Re-runs tests to confirm resolution

**Output**:

- Fixed test files
- Updated Page Objects, StateFactory, or XState machines as needed
- Passing tests or skipped tests with explanations

**Example Usage**:

```
Fix the failing tests in the example directory
```

**Key Features**:

- Understands model-based testing architecture
- Fixes StateFactory registration issues
- Updates Page Object validations
- Corrects XState machine definitions
- Handles hierarchical state problems
- Uses semantic locators and best practices

## 🏗️ Module Builder

The **module-builder** agent helps develop and maintain the playwright-state-model module itself.

**Purpose**: Plan, generate, and fix code for playwright-state-model module development following expert-level standards.

**Input**:

- Module development tasks (planning, generating, fixing)
- Code changes or improvements needed

**Agent File**: `module-builder-improved.md`

**What It Does**:

1. **Plans** - Creates step-by-step plans for module development
2. **Generates** - Creates new module code following best practices
3. **Fixes** - Resolves issues in module code
4. **Maintains Standards** - Ensures code follows all quality standards

**Output**:

- Planned solutions
- Generated code
- Fixed code
- Documentation

**Example Usage**:

```
Add a new feature to support parallel state validation
```

**Key Features**:

- Node.js module development expertise
- TypeScript best practices
- Playwright integration patterns
- XState state machine patterns
- Code quality enforcement

## Workflow Examples

### Complete Test Creation Workflow

1. **Planner** creates a test plan:

   ```
   Create a model-based test plan for the checkout flow
   ```

   → Generates `specs/checkout-plan.md`

2. **Generator** creates test implementation:

   ```
   Generate tests based on specs/checkout-plan.md
   ```

   → Generates complete test suite

3. **Healer** fixes any issues:
   ```
   Fix the failing checkout tests
   ```
   → Ensures all tests pass

### Module Development Workflow

1. **Module Builder** plans the feature:

   ```
   Add support for parallel state validation
   ```

   → Creates implementation plan

2. **Module Builder** generates code:

   ```
   Implement the parallel validation feature
   ```

   → Generates production-ready code

3. **Module Builder** fixes issues:
   ```
   Fix the TypeScript errors in the new feature
   ```
   → Resolves all issues

## Agent Definitions

Agent definitions are markdown files with YAML frontmatter that specify:

- **name**: Agent identifier
- **description**: When to use this agent
- **tools**: Available tools (glob_file_search, grep, read_file, list_dir, search_replace, write, browser MCP tools, run_terminal_cmd)
- **model**: AI model to use (typically `sonnet`)
- **color**: Visual identifier for the agent

### File Structure

```
agents/
├── README.md                      # This file
├── state-model-test-planner.md    # Planner agent definition
├── state-model-test-generator.md  # Generator agent definition
├── state-model-test-healer.md     # Healer agent definition
└── module-builder-improved.md    # Module builder agent definition
```

## Artifacts and Conventions

The agents follow a simple, auditable structure:

```bash
project/
  agents/                          # Agent definitions
    README.md
    state-model-test-planner.md
    state-model-test-generator.md
    state-model-test-healer.md
    module-builder-improved.md
  specs/                           # Test plans (generated by planner)
    navigation-plan.md
    checkout-plan.md
  src/                             # Generated code (by generator)
    machine.ts                     # XState state machine
    factory.ts                     # StateFactory configuration
    pages/                         # Page Object Models
      HomePage.ts
      CheckoutPage.ts
  tests/                           # Generated tests (by generator)
    navigation.spec.ts
    checkout.spec.ts
  playwright.config.ts
```

### Specs in `specs/`

Test plans created by the planner agent. They include:

- Application overview
- XState machine definition
- Page Object specifications
- StateFactory configuration
- Detailed test scenarios

### Generated Code in `src/`

Code generated by the generator agent:

- **machine.ts**: XState state machine definition
- **factory.ts**: StateFactory configuration function
- **pages/**: Page Object Models extending `BaseState`

### Tests in `tests/`

Playwright test files using `ModelExecutor`:

- Import `ModelExecutor`, machine, and factory
- Use `executor.validateCurrentState()` for validation
- Use `executor.dispatch()` for state transitions
- Assert state values with `executor.currentStateValue`

## Best Practices

### Using the Planner

- Provide clear, specific requests
- Include context about the application
- Reference existing patterns when available

### Using the Generator

- Ensure test plans are complete before generation
- Review generated code for accuracy
- Verify state IDs match across all files

### Using the Healer

- Let the healer fix issues systematically
- Review fixes before committing
- Understand the root cause of failures

### Using the Module Builder

- Follow the "Plan-Execute-Verify" methodology
- Maintain consistency with existing code
- Follow all quality standards

## Integration with playwright-state-model

All agents understand and work with:

- **ModelExecutor**: State machine execution and validation
- **StateFactory**: State-to-PageObject mapping registry
- **BaseState**: Abstract base class for Page Objects
- **Hierarchical States**: Nested state resolution
- **Event Bubbling**: Bottom-up event traversal
- **State Validation**: Top-down validation flow
- **Context Injection**: XState context for data-driven testing

## References

- **playwright-state-model**: [GitHub Repository](https://github.com/gustavo-meilus/playwright-state-model)
- **XState Documentation**: [xstate.js.org](https://xstate.js.org)
- **Playwright Documentation**: [playwright.dev](https://playwright.dev)
- **Example Implementation**: `example/` directory in playwright-state-model repository

## Support

For issues or questions:

- Review the example in `example/` directory
- Check the main `README.md` for module documentation
- Refer to XState and Playwright documentation
- Open an issue on GitHub
