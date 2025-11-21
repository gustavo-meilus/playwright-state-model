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

These agents can be used independently, sequentially, or as chained calls in the agentic loop. Using them sequentially will produce comprehensive test coverage for your application using model-based testing principles.

- **🎯 planner** explores the app and produces a Markdown test plan with XState machine definitions
- **⚡ generator** transforms the Markdown plan into executable Playwright tests using playwright-state-model
- **🔧 healer** executes the test suite and automatically repairs failing tests

### Model-Based Testing Approach

Unlike traditional Playwright tests, these agents leverage **playwright-state-model**, which bridges formal XState state machines with Playwright Page Objects. This approach provides:

- **Hierarchical State Resolution**: Automatically resolves nested XState states to Page Object chains
- **Event Bubbling**: Events bubble from leaf states to root (bottom-up traversal)
- **State Validation**: Validates entire state hierarchy top-down (root to leaf)
- **Context Injection**: XState context automatically injected into Page Objects for data-driven testing
- **Type Safety**: Full TypeScript support with proper type inference

### Getting Started

Start with adding Playwright State Model Test Agent definitions to your project using the `init-agents` command. These definitions should be regenerated whenever playwright-state-model is updated to pick up new tools and instructions.

```bash tab=bash-vscode
npx playwright-state-model init-agents --loop=vscode
```

```bash tab=bash-claude
npx playwright-state-model init-agents --loop=claude
```

```bash tab=bash-opencode
npx playwright-state-model init-agents --loop=opencode
```

Once the agents have been generated, you can use your AI tool of choice to command these agents to build model-based tests using playwright-state-model.

**Agent Definitions**

Agent definitions are markdown files located in the `.vscode/agents/`, `.claude/agents/`, or `.opencode/agents/` directory (depending on your chosen loop). They contain instructions and MCP tool references. These definitions should be updated whenever playwright-state-model or Playwright is updated to pick up new tools and patterns.

## 🎯 Planner

Planner agent explores your app and produces a test plan for one or many scenarios and user flows using model-based testing principles.

**Input**

- A clear request to the planner (e.g., "Generate a plan for guest checkout.")
- Understanding of the target application or website
- _(optional)_ A seed test that sets up the environment necessary to interact with your app
- _(optional)_ Existing XState machine definitions

**Prompt**

> Notice how the `seed.spec.ts` can be included in the context of the planner.
> Planner will use this test as an example of all the generated tests. Alternatively, you can mention the file name in the prompt.

**Example: seed.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";

test("seed", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);
  await page.goto("https://example.com");
  // this test uses custom fixtures and demonstrates the pattern
});
```

**Output**

- A Markdown test plan saved as `specs/basic-operations.md`.
- The plan includes complete XState machine definitions, Page Object specifications, StateFactory configuration, and detailed test scenarios.
- The plan is human-readable but precise enough for test generation.

<details>
<summary>Example: <b>specs/navigation-plan.md</b></summary>

```markdown
# Application Navigation - Model-Based Test Plan

## Application Overview

The application features navigation between multiple sections with hierarchical states.

## XState Machine Definition

\`\`\`typescript
import { createMachine } from 'xstate';

export const appMachine = createMachine({
id: 'app',
initial: 'home',
states: {
home: {
id: 'home',
on: {
NAVIGATE_TO_DOCS: { target: 'docs' },
},
},
// ... more states
},
});
\`\`\`

## Page Object Models

### HomePage

- **State ID**: `home`
- **Validation**: URL matches home page, main heading visible
- **Events**: `NAVIGATE_TO_DOCS()`

## StateFactory Configuration

\`\`\`typescript
export function createStateFactory(page: Page): StateFactory {
const factory = new StateFactory(page);
factory.register('home', HomePage);
// ... more registrations
return factory;
}
\`\`\`

## Test Scenarios

### 1. Basic Navigation Flow

**File**: `tests/navigation/basic-flow.spec.ts`

**Steps:**

1. Create ModelExecutor with appMachine and factory
2. Navigate to application URL
3. Validate initial state: `await executor.validateCurrentState()`
4. Assert state: `expect(executor.currentStateValue).toBe('home')`
5. Dispatch navigation: `await executor.dispatch('NAVIGATE_TO_DOCS')`
6. Assert new state: `expect(executor.currentStateValue).toEqual({ docs: 'overview' })`
7. Validate new state: `await executor.validateCurrentState()`

**Expected Results:**

- Initial state is `home`
- Navigation transitions to `docs.overview`
- All Page Object validations pass
```

</details>

## ⚡ Generator

Generator agent uses the Markdown plan to produce executable Playwright Tests using playwright-state-model. It verifies selectors and assertions live as it performs the scenarios. Playwright supports generation hints and provides a catalog of assertions for efficient structural and behavioral validation.

**Input**

- Markdown plan from `specs/`

**Prompt**

> Notice how the `navigation-plan.md` is included in the context of the generator.
> This is how generator knows where to get the test plan from. Alternatively, you can mention the file name in the prompt.

**Output**

- A test suite under `tests/`
- Complete XState machine definition (`src/machine.ts`)
- Page Object Models (`src/pages/*.ts`)
- StateFactory configuration (`src/factory.ts`)
- Generated tests may include initial errors that can be healed automatically by the healer agent

<details>
<summary>Example: <b>tests/navigation.spec.ts</b></summary>

```typescript
// spec: specs/navigation-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { ModelExecutor } from "playwright-state-model";
import { appMachine } from "../src/machine";
import { createStateFactory } from "../src/factory";

test.describe("Navigation Model", () => {
  test("should navigate through states", async ({ page }) => {
    const factory = createStateFactory(page);
    const executor = new ModelExecutor(page, appMachine, factory);

    await page.goto("https://example.com");

    // Validate initial state
    await executor.validateCurrentState();
    expect(executor.currentStateValue).toBe("home");

    // Dispatch navigation event
    await executor.dispatch("NAVIGATE_TO_DOCS");
    expect(executor.currentStateValue).toEqual({ docs: "overview" });
    await executor.validateCurrentState();
  });
});
```

</details>

## 🔧 Healer

When the test fails, the healer agent:

- Replays the failing steps
- Inspects the current UI to locate equivalent elements or flows
- Analyzes model-based testing specific issues (StateFactory, Page Objects, XState machines)
- Suggests a patch (e.g., locator update, state registration fix, event handler addition)
- Re-runs the test until it passes or until guardrails stop the loop

**Input**

- Failing test name

**Prompt**

> The healer agent will automatically identify and fix issues in model-based tests.

**Output**

- A passing test, or a skipped test if the healer believes that functionality is broken.

## 🏗️ Module Builder

The **module-builder** agent helps develop and maintain the playwright-state-model module itself.

**Purpose**: Plan, generate, and fix code for playwright-state-model module development following expert-level standards.

**Input**

- Module development tasks (planning, generating, fixing)
- Code changes or improvements needed

**Output**

- Planned solutions
- Generated code
- Fixed code
- Documentation

## Artifacts and Conventions

The static agent definitions and generated files follow a simple, auditable structure:

```bash
repo/
  agents/                    # agent definitions
    README.md
    seed.spec.ts             # template seed test
    state-model-test-planner.md
    state-model-test-generator.md
    state-model-test-healer.md
    module-builder.md
  specs/                     # human-readable test plans
    navigation-plan.md
    checkout-plan.md
  src/                       # generated code (by generator)
    machine.ts               # XState state machine
    factory.ts               # StateFactory configuration
    pages/                   # Page Object Models
      HomePage.ts
      CheckoutPage.ts
  tests/                     # generated Playwright tests
    seed.spec.ts             # seed test for environment
    navigation.spec.ts
    checkout.spec.ts
  playwright.config.ts
```

### Agent Definitions

Under the hood, agent definitions are collections of instructions and MCP tools. They are provided by playwright-state-model and should be updated whenever the module or Playwright is updated.

Agent definitions are markdown files with YAML frontmatter that specify:

- **name**: Agent identifier
- **description**: When to use this agent
- **tools**: Available tools (file operations, `mcp__playwright-test__*` browser tools, `mcp__playwright-test__test_*` execution tools)
- **model**: AI model to use (typically `sonnet`)
- **color**: Visual identifier for the agent

### Specs in `specs/`

Specs are structured plans describing scenarios in human-readable terms. They include:

- Application overview
- Complete XState machine definition
- Page Object Model specifications
- StateFactory configuration
- Steps, expected outcomes, and data

Specs can start from scratch or extend a seed test.

### Generated Code in `src/`

Code generated by the generator agent:

- **machine.ts**: XState state machine definition
- **factory.ts**: StateFactory configuration function
- **pages/**: Page Object Models extending `BaseState`

### Tests in `tests/`

Generated Playwright tests, aligned one-to-one with specs wherever feasible. Tests use `ModelExecutor` to:

- Import `ModelExecutor`, machine, and factory
- Use `executor.validateCurrentState()` for validation
- Use `executor.dispatch()` for state transitions
- Assert state values with `executor.currentStateValue`

### Seed tests `seed.spec.ts`

Seed tests provide a ready-to-use `page` context and demonstrate the model-based testing pattern. They bootstrap execution and serve as examples for generated tests.

A template seed file is available at `agents/seed.spec.ts` that you can copy and customize for your project. The example directory also includes a working seed test at `example/tests/seed.spec.ts` that demonstrates the pattern with a real application.

## References

- **playwright-state-model**: [GitHub Repository](https://github.com/gustavo-meilus/playwright-state-model)
- **Playwright Test Agents**: [playwright.dev/docs/test-agents](https://playwright.dev/docs/test-agents)
- **XState Documentation**: [xstate.js.org](https://xstate.js.org)
- **Playwright Documentation**: [playwright.dev](https://playwright.dev)
- **Example Implementation**: `example/` directory in playwright-state-model repository
