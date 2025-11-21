# State Model Test Healer Agent

## Overview

The **state-model-test-healer** agent is a specialized Claude/Gemini agent designed to debug and fix failing tests that use `playwright-state-model`, XState state machines, and Playwright Page Objects.

## Purpose

This agent helps you:

- Debug failing model-based tests systematically
- Fix StateFactory registration errors
- Resolve Page Object validation failures
- Correct XState machine definition issues
- Fix event handler and state transition problems
- Handle hierarchical state resolution issues
- Resolve context injection problems

## Key Features

### 1. **Model-Based Testing Awareness**

- Understands `ModelExecutor`, `StateFactory`, and `BaseState` architecture
- Recognizes hierarchical state patterns (e.g., `docs.overview`)
- Handles event bubbling and state validation flows
- Knows state value structures (strings vs objects)

### 2. **Systematic Error Classification**

- **StateFactory Registration Errors**: Missing or mismatched state IDs
- **Page Object Validation Failures**: UI assertion failures
- **Event Handler Not Found**: Missing event methods
- **State Value Assertion Failures**: State mismatch errors
- **State Transition Failures**: XState machine issues
- **Hierarchical State Resolution**: Nested state problems
- **Context Injection Problems**: XState context issues

### 3. **Intelligent Root Cause Analysis**

- Checks StateFactory registrations first (most common issue)
- Verifies Page Object implementations
- Reviews XState machine definitions
- Validates ModelExecutor usage patterns
- Examines state hierarchy and event flow

### 4. **Robust Fixes**

- Updates selectors to match current UI
- Fixes state ID mismatches
- Adds missing event handlers
- Corrects XState machine definitions
- Updates state value assertions
- Registers missing states

## Usage

### Basic Usage

1. **Invoke the agent** when tests are failing
2. **Agent runs tests** to identify failures
3. **Agent debugs** each failing test systematically
4. **Agent fixes** issues one at a time
5. **Agent verifies** fixes work correctly

### Example Invocation

```
Fix the failing tests in the example directory
```

The agent will:

1. Run all tests to identify failures
2. Debug each failing test
3. Classify error types
4. Fix issues systematically
5. Verify all tests pass

## Common Failure Patterns

### Pattern 1: Missing State Registration

**Error**: `StateFactory: No class registered for State ID 'docs.overview'`

**Fix**: Add missing registration:

```typescript
factory.register("docs.overview", DocsOverviewPage);
```

### Pattern 2: State ID Mismatch

**Error**: State ID doesn't match between machine and factory

**Fix**: Ensure IDs match exactly:

```typescript
// Machine
docs: {
  id: 'docs.overview', // must match factory registration
}

// Factory
factory.register('docs.overview', PageObject); // matches machine id
```

### Pattern 3: Event Handler Missing

**Error**: `Event 'NAVIGATE_TO_HOME' not handled by active chain`

**Fix**: Add missing event handler to Page Object:

```typescript
async NAVIGATE_TO_HOME(): Promise<void> {
  await this.page.getByRole('link', { name: /home/i }).click();
}
```

### Pattern 4: Validation Assertion Failure

**Error**: `expect(locator).toBeVisible()` fails

**Fix**: Update selector or use more resilient locator:

```typescript
// Use semantic locator with fallback
await expect(this.page.getByRole("heading").first()).toBeVisible();

// Or use regex for dynamic content
await expect(this.page).toHaveURL(/^https:\/\/example\.com\/docs/);
```

### Pattern 5: State Value Mismatch

**Error**: `expect(executor.currentStateValue).toBe('home')` fails but actual is `{ docs: 'overview' }`

**Fix**: Use `.toEqual()` for hierarchical states:

```typescript
expect(executor.currentStateValue).toEqual({ docs: "overview" });
```

### Pattern 6: XState Transition Not Defined

**Error**: State didn't change after event dispatch

**Fix**: Add event handler to XState machine:

```typescript
stateName: {
  id: 'stateName',
  on: {
    MISSING_EVENT: { target: 'targetState' }, // add this
  },
}
```

## Workflow

### 1. Initial Execution

- Run all tests to identify failures
- Identify which tests use playwright-state-model

### 2. Debug Failed Tests

- Debug each failing test
- Capture page snapshots
- Examine error details
- Check console messages

### 3. Error Classification

- Categorize into failure types
- Identify root cause
- Determine fix strategy

### 4. Root Cause Analysis

- Check StateFactory registrations
- Verify Page Object implementations
- Review XState machine definitions
- Validate ModelExecutor usage

### 5. Code Remediation

- Fix StateFactory registrations
- Update Page Object validations
- Add missing event handlers
- Correct XState machine definitions
- Fix state assertions

### 6. Verification

- Restart test after each fix
- Verify fix resolves error
- Check no new errors introduced

### 7. Iteration

- Repeat for each error
- Fix one at a time
- Continue until all tests pass

## Key Principles

### Model-Based Testing Awareness

- **Understand State Machine**: Check XState definition for transition failures
- **State Hierarchy**: Remember hierarchical states need multiple registrations
- **Event Bubbling**: Events bubble bottom-up; child handlers execute first
- **State Validation**: Validation happens top-down; parent before children
- **State Value Structure**: Simple states are strings, hierarchical are objects

### Systematic Debugging

- **Start with StateFactory**: Most common issue
- **Then Page Objects**: Verify validations and handlers
- **Then XState Machine**: Check definitions and transitions
- **Finally ModelExecutor**: Verify usage patterns

### Robust Solutions

- **Semantic Locators**: Prefer `getByRole`, `getByLabel`, `getByText`
- **Regular Expressions**: For dynamic content
- **Resilient Selectors**: Use `.first()`, `.or()`, fallbacks
- **Proper State IDs**: Match exactly between machine and factory
- **Complete Registrations**: Register all state variations

## Special Handling

### When Test is Correct but Application Changed

- Mark as `test.fixme()` with explanation
- Document what changed and why
- Example:
  ```typescript
  test.fixme("should navigate to docs", async ({ page }) => {
    // Application navigation changed - docs link no longer exists
  });
  ```

### When Multiple Errors Exist

- Fix errors one at a time
- Start with first failure
- Each fix may resolve subsequent errors
- Retest after each fix

### When State Machine Needs Refactoring

- Refactor machine to match application behavior
- Update all related Page Objects
- Update factory registrations
- Update test assertions

## Debugging Tools

The agent uses Playwright MCP tools:

- **browser_snapshot**: See current page state
- **browser_console_messages**: Check ModelExecutor logs
- **browser_generate_locator**: Find better selectors
- **browser_network_requests**: Verify navigation
- **test_debug**: Debug failing tests
- **test_run**: Run tests and verify fixes

## Output Format

After fixing each test:

1. **Document the Issue**: What was broken and why
2. **Explain the Fix**: What changed and how it resolves the issue
3. **Verify Success**: Confirm test now passes
4. **Add Comments**: Include code comments explaining fixes

Example:

```typescript
// Fixed: State ID mismatch - machine uses 'docs.overview' but factory registered 'docs_overview'
factory.register('docs.overview', DocsOverviewPage);

// Fixed: Updated selector to match new UI structure
async NAVIGATE_TO_DOCS(): Promise<void> {
  await this.page.getByRole('link', { name: /documentation/i }).first().click();
}
```

## Non-Interactive Behavior

- **No user questions**: Makes most reasonable fix based on analysis
- **Continues until complete**: Fixes all errors until tests pass
- **Thorough**: Checks all related files (machine, factory, Page Objects, tests)
- **Systematic**: Follows workflow methodically
- **Documented**: Adds comments explaining non-obvious fixes

## Comparison with Standard Test Healer

| Feature              | Standard Healer          | State Model Healer                                      |
| -------------------- | ------------------------ | ------------------------------------------------------- |
| **Focus**            | General Playwright tests | Model-based tests with playwright-state-model           |
| **State Management** | Manual                   | Understands XState machines                             |
| **Page Objects**     | Standard POM             | Extends `BaseState`                                     |
| **Error Types**      | General test failures    | StateFactory, Page Object, XState, ModelExecutor errors |
| **State Validation** | Manual assertions        | Automatic state validation via `ModelExecutor`          |
| **Hierarchy**        | Not supported            | Full hierarchical state support                         |
| **Event Handling**   | Direct calls             | Event bubbling through states                           |

## Integration with playwright-state-model

The agent understands and fixes:

- **ModelExecutor**: State machine execution and validation
- **StateFactory**: State-to-PageObject mapping registry
- **BaseState**: Abstract base class for Page Objects
- **Hierarchical States**: Nested state resolution
- **Event Bubbling**: Bottom-up event traversal
- **State Validation**: Top-down validation flow
- **Context Injection**: XState context for data-driven testing

## Best Practices Enforced

1. **Semantic Locators**: Use `getByRole`, `getByLabel`, `getByText`
2. **No Deprecated APIs**: Avoid `waitForNetworkIdle`, `$()`, `$$()`
3. **Auto-waiting**: Leverage Playwright's auto-waiting
4. **Resilient Selectors**: Use `.first()`, `.or()`, regex patterns
5. **Proper State IDs**: Match exactly between machine and factory
6. **Complete Registrations**: Register all state variations
7. **Clear Comments**: Document fixes and reasoning

## References

- **Agent Prompt**: `prompts/state-model-test-healer.md`
- **Module Documentation**: `README.md`
- **Example Implementation**: `example/` directory
- **XState Docs**: https://xstate.js.org
- **Playwright Docs**: https://playwright.dev
- **Microsoft Playwright Test Healer**: Reference implementation pattern

## Next Steps

1. **Use the agent** when tests fail
2. **Review fixes** to understand patterns
3. **Learn from fixes** to prevent similar issues
4. **Maintain tests** following best practices

## Support

For issues or questions:

- Review the example in `example/` directory
- Check `README.md` for module documentation
- Refer to XState and Playwright documentation
- Open an issue on GitHub
