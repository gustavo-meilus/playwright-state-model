# State Model Test Planner Agent

## Overview

The **state-model-test-planner** agent is a specialized Claude/Gemini agent designed to create comprehensive model-based test plans using `playwright-state-model`, XState state machines, and Playwright Page Objects.

## Purpose

This agent helps you:

- Design XState state machines for web applications
- Create Page Object Models that extend `BaseState`
- Configure `StateFactory` for state-to-PageObject mappings
- Generate comprehensive test scenarios with proper validation
- Produce maintainable, scalable test plans following best practices

## Key Features

### 1. **Model-Based Testing Approach**

- Designs formal XState state machines before writing tests
- Maps application states to Page Objects systematically
- Ensures complete state transition coverage

### 2. **Hierarchical State Support**

- Handles nested states (e.g., `docs.overview`, `docs.gettingStarted`)
- Automatically resolves state hierarchies
- Validates parent and child states correctly

### 3. **Event-Driven Testing**

- Uses event bubbling (bottom-up traversal)
- Matches XState event names to Page Object methods
- Validates state transitions automatically

### 4. **Comprehensive Test Coverage**

- Happy path scenarios
- Edge cases and boundary conditions
- Error handling scenarios
- Context-driven testing (when applicable)

## Usage

### Basic Usage

1. **Invoke the agent** with a description of the application to test
2. **Agent explores** the application (if browser tools available)
3. **Agent designs** XState machine, Page Objects, and test scenarios
4. **Agent outputs** complete test plan as markdown file

### Example Invocation

```
Create a model-based test plan for https://example.com
```

The agent will:

1. Analyze the application
2. Design XState state machine
3. Create Page Object Models
4. Configure StateFactory
5. Generate comprehensive test scenarios

## Agent Capabilities

### What the Agent Does

✅ **Designs XState Machines**

- Creates complete state machine definitions
- Models hierarchical states
- Defines all state transitions
- Includes context for data-driven testing

✅ **Creates Page Objects**

- Extends `BaseState` class
- Implements `validateState()` methods
- Creates event handler methods matching XState events
- Uses semantic Playwright locators

✅ **Configures StateFactory**

- Registers all state-to-PageObject mappings
- Handles hierarchical state registrations
- Creates factory function

✅ **Generates Test Scenarios**

- Complete test implementations
- Proper state validation
- Edge case coverage
- Clear documentation

### What the Agent Follows

- **playwright-state-model** patterns and best practices
- **XState** state machine design principles
- **Playwright** Page Object Model patterns
- **TypeScript** best practices
- **Model-Based Testing** methodology

## Output Structure

The agent produces a markdown file containing:

1. **Application Overview**
   - Description of application
   - Key features and functionality
   - State machine architecture

2. **XState Machine Definition**
   - Complete machine code
   - State hierarchy visualization
   - Event definitions

3. **Page Object Models**
   - All Page Object classes
   - State mappings
   - Validation criteria

4. **StateFactory Configuration**
   - Complete factory setup
   - All state registrations

5. **Test Scenarios**
   - Numbered test cases
   - Detailed steps
   - Expected results
   - Edge cases

## Example Output

See the `state-model-test-planner.md` file for a complete example based on the Playwright.dev website, including:

- Complete XState machine definition
- All Page Object implementations
- StateFactory configuration
- Multiple test scenarios with detailed steps

## Integration with playwright-state-model

The agent understands and leverages:

- **BaseState**: Abstract base class for Page Objects
- **StateFactory**: State-to-PageObject mapping registry
- **ModelExecutor**: State machine execution and validation
- **Hierarchical State Resolution**: Automatic parent/child state handling
- **Event Bubbling**: Bottom-up event traversal
- **Context Injection**: XState context for data-driven testing

## Best Practices Enforced

1. **Model First**: Design state machine before tests
2. **State Mapping**: Every state has a Page Object
3. **Validation**: Always validate after transitions
4. **Hierarchy**: Leverage nested states for complex UIs
5. **Semantic Locators**: Use `getByRole`, `getByLabel`, `getByText`
6. **Type Safety**: Full TypeScript support
7. **Independence**: Tests run in any order
8. **Maintainability**: Clear, documented code

## References

- **Agent Prompt**: `prompts/state-model-test-planner.md`
- **Module Documentation**: `README.md`
- **Example Implementation**: `example/` directory
- **XState Docs**: https://xstate.js.org
- **Playwright Docs**: https://playwright.dev

## Comparison with Standard Test Planner

| Feature              | Standard Planner  | State Model Planner             |
| -------------------- | ----------------- | ------------------------------- |
| **Approach**         | Ad-hoc test cases | Model-based with state machines |
| **State Management** | Manual            | Formal XState machines          |
| **Page Objects**     | Standard POM      | Extends `BaseState`             |
| **Validation**       | Manual assertions | Automatic state validation      |
| **Hierarchy**        | Not supported     | Full hierarchical state support |
| **Event Handling**   | Direct calls      | Event bubbling through states   |
| **Context**          | Manual            | XState context injection        |

## Next Steps

1. **Use the agent** to create test plans for your applications
2. **Review generated plans** and adapt to your needs
3. **Implement tests** following the generated structure
4. **Extend scenarios** as your application evolves

## Support

For issues or questions:

- Review the example in `example/` directory
- Check `README.md` for module documentation
- Refer to XState and Playwright documentation
- Open an issue on GitHub
