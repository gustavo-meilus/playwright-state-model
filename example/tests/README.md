# Test Plans and Coverage Documentation

This directory contains comprehensive test plans for improving coverage of the Playwright.dev example tests.

## Documents

### 1. `TEST_PLAN.md` - Comprehensive Test Plan

A detailed test plan following the state-model-test-planner format with:

- **20 detailed test scenarios** covering:
  - Complete navigation flows
  - Network request validation (with examples)
  - Event bubbling behavior
  - State persistence
  - Edge cases and error handling
  - All navigation paths from each state

- **Implementation details** including:
  - Network request validation patterns
  - Code examples for each scenario
  - Expected results and edge cases
  - Test organization structure

- **Ready-to-implement** test scenarios with:
  - Step-by-step instructions
  - Expected state values
  - Validation points
  - Edge case considerations

### 2. `COVERAGE_IMPROVEMENT_PLAN.md` - Coverage Analysis

A strategic document outlining:

- **Current coverage analysis** of existing tests
- **Coverage gaps** identified
- **8 test categories** with priorities:
  1. Network Request Validation (High Priority)
  2. Comprehensive Navigation Paths (High Priority)
  3. Event Bubbling (High Priority)
  4. State Persistence (Medium Priority)
  5. Edge Cases (Lower Priority)
  6. Context-Driven Scenarios (Lower Priority)
  7. Hierarchical State Resolution (Medium Priority)
  8. Performance Tests (Lower Priority)

- **Test file organization** structure
- **Implementation priority** recommendations

## Key Improvements Planned

### Network Request Validation

All navigation actions will be validated to ensure:

- HTTP requests are made to correct endpoints
- Response status codes are successful (200-299)
- Requests complete before state transitions
- Network timing doesn't cause race conditions

**Example Pattern**:

```typescript
const requestPromise = page.waitForRequest(
  (request) => request.url().includes("/docs") && request.method() === "GET"
);
const responsePromise = page.waitForResponse(
  (response) => response.url().includes("/docs") && response.status() === 200
);

await Promise.all([executor.dispatch("NAVIGATE_TO_DOCS"), requestPromise, responsePromise]);
```

### Comprehensive Navigation Coverage

Tests will cover:

- All possible navigation paths from each state
- Direct navigation paths
- Sequential navigation flows
- Return-to-previous-state scenarios

### Event Bubbling Verification

Tests will verify:

- Events bubble correctly from child to parent states
- Event handling precedence
- State transitions during event bubbling

### Edge Case Handling

Tests will cover:

- Invalid event dispatch handling
- State validation failures
- Network request failures
- Concurrent navigation attempts

## Test Organization

Tests will be organized into categories:

```
tests/
├── network/
│   ├── navigation-requests.spec.ts
│   └── sequential-navigation-requests.spec.ts
├── navigation/
│   ├── complete-flow.spec.ts
│   ├── all-paths-from-home.spec.ts
│   ├── all-paths-from-docs-overview.spec.ts
│   ├── all-paths-from-getting-started.spec.ts
│   └── all-paths-from-api.spec.ts
├── event-bubbling/
│   ├── bubbling-behavior.spec.ts
│   └── api-navigation-bubbling.spec.ts
├── state-persistence/
│   ├── persistence-tests.spec.ts
│   ├── rapid-transitions.spec.ts
│   └── return-to-previous-state.spec.ts
├── validation/
│   └── hierarchical-state.spec.ts
├── edge-cases/
│   ├── invalid-transitions.spec.ts
│   ├── validation-failure.spec.ts
│   ├── network-failure.spec.ts
│   └── concurrent-navigation.spec.ts
└── playwright-dev.spec.ts (existing)
```

## Implementation Priority

### Phase 1: High Priority (Implement First)

1. **Network Request Validation Tests**
   - Navigation to Docs triggers network request
   - Navigation to API triggers network request
   - Navigation to Getting Started triggers network request
   - Multiple navigation requests in sequence

2. **Comprehensive Navigation Path Tests**
   - All paths from home state
   - All paths from docs overview state
   - All paths from getting started state
   - All paths from API state

3. **Event Bubbling Tests**
   - Event bubbling from child to parent
   - Event bubbling for NAVIGATE_TO_API

### Phase 2: Medium Priority

4. **State Persistence Tests**
   - State persistence across multiple transitions
   - Rapid state transitions
   - Return to previous state

5. **Hierarchical State Resolution Tests**
   - Nested state resolution
   - State hierarchy validation order

### Phase 3: Lower Priority

6. **Edge Cases**
   - Invalid event dispatch handling
   - State validation failure handling
   - Network request failure handling
   - Concurrent navigation attempts

7. **Context-Driven Scenarios**
   - Context updates during navigation

8. **Performance Tests**
   - Navigation timing
   - State validation performance

## Usage

1. **Review** `TEST_PLAN.md` for detailed test scenarios
2. **Review** `COVERAGE_IMPROVEMENT_PLAN.md` for strategic overview
3. **Implement** tests following the patterns and examples provided
4. **Run** tests to verify coverage improvements
5. **Iterate** based on test results

## Next Steps

1. Start implementing Phase 1 tests (High Priority)
2. Use the network request validation pattern for all navigation tests
3. Ensure all tests follow the ModelExecutor pattern
4. Verify tests are independent and can run in any order
5. **Verify parallelism safety**: Run tests with `--repeat-each 10 --workers 5` to ensure stability
6. Monitor test execution time and optimize if needed

## Parallelism and Race Condition Safety

All tests in this directory are designed to be **parallelism-safe** and **race condition-free**:

### Test Isolation Requirements

- **Fresh Instances**: Each test creates its own `ModelExecutor` and factory instances
- **No Shared State**: Tests never share executors, factories, or state between tests
- **Page Isolation**: Each test uses its own `page` fixture
- **Idempotent Operations**: Event handlers are designed to be idempotent when possible

### Verification

Run the following command to verify parallelism safety:

```bash
npx playwright test --repeat-each 10 --workers 5
```

All tests should pass consistently across multiple parallel executions.

### Best Practices

- **Use Test Helpers**: Leverage `tests/helpers/test-setup.ts` for common setup patterns
- **Use Constants**: Import constants from `src/constants.ts` instead of magic strings
- **Auto-Waiting**: Use Playwright's built-in auto-waiting instead of manual timeouts
- **No Timing Dependencies**: Avoid `waitForTimeout()` - use element visibility checks instead

## References

- [playwright-state-model Documentation](../../README.md)
- [XState Documentation](https://xstate.js.org)
- [Playwright Network Documentation](https://playwright.dev/docs/network)
