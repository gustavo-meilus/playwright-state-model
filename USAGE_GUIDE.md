# Usage Guide: Maximizing Value from Playwright State Model

This guide addresses common questions about when and how to use the state model effectively, based on real-world usage patterns.

## Understanding State Model Value

### What State Model Provides

The state model offers several key benefits:

1. **State Transition Testing** - Verify navigation flows work correctly
2. **State Consistency** - Ensure UI matches expected state machine state
3. **Automatic Validation** - Validate entire state hierarchy automatically
4. **Documentation** - State machine serves as living documentation
5. **Test Generation** - Can generate test paths from state machine

### Common Misconceptions

**❌ Misconception**: State validation is just wrapping `waitLoadingLocators()`

**✅ Reality**: State validation calls `validateState()` on Page Objects, which should contain **real UI assertions** (URL checks, element visibility, content validation). If your `validateState()` only waits for loading, you're missing the value.

**❌ Misconception**: State value assertions test the UI

**✅ Reality**: `currentStateValue` only checks the state machine. Always combine with `validateCurrentState()` to verify UI actually matches.

**❌ Misconception**: State model is required for all tests

**✅ Reality**: Use state model for navigation/flow tests. Use direct navigation for simple page tests.

## When to Use State Model

### ✅ Use State Model For:

1. **Navigation Flow Tests**
   ```typescript
   test("should navigate through all states", async ({ page }) => {
     const executor = createExecutor(page, appMachine, setupFactory);
     
     await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
     await executor.expectState("dashboard");
     
     await executor.navigateAndValidate("NAVIGATE_TO_SETTINGS");
     await executor.expectState("settings");
   });
   ```

2. **State Transition Verification**
   ```typescript
   test("should handle invalid transitions", async ({ page }) => {
     const executor = createExecutor(page, appMachine, setupFactory);
     
     // Verify invalid transition is rejected
     await expect(
       executor.dispatch("INVALID_EVENT")
     ).rejects.toThrow();
   });
   ```

3. **Complex Multi-Page Workflows**
   ```typescript
   test("complete user onboarding flow", async ({ page }) => {
     const executor = createExecutor(page, onboardingMachine, setupFactory);
     
     await executor.navigateAndValidate("START_ONBOARDING");
     await executor.navigateAndValidate("COMPLETE_STEP_1");
     await executor.navigateAndValidate("COMPLETE_STEP_2");
     await executor.expectState("onboarding.complete");
   });
   ```

4. **State Consistency Checks**
   ```typescript
   test("state persists across actions", async ({ page }) => {
     const executor = createExecutor(page, appMachine, setupFactory);
     
     await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
     // Perform actions on dashboard
     await page.click("button");
     // Verify still in correct state
     await executor.expectState("dashboard");
   });
   ```

### ❌ Don't Use State Model For:

1. **Single Page Tests** (unless testing navigation)
   ```typescript
   // ✅ Better: Direct navigation for simple page tests
   test("dashboard displays data", async ({ page }) => {
     await app.dashboard.goto();
     await expect(page.locator("h1")).toBeVisible();
   });
   ```

2. **API-Only Tests**
   ```typescript
   // ✅ Better: No state model needed
   test("API returns correct data", async ({ api }) => {
     const response = await api.get("/users");
     expect(response.status).toBe(200);
   });
   ```

3. **Performance-Critical Tests**
   ```typescript
   // ✅ Better: Skip state validation overhead
   test("page loads quickly", async ({ page }) => {
     const start = Date.now();
     await page.goto("https://example.com");
     expect(Date.now() - start).toBeLessThan(1000);
   });
   ```

## Writing Effective State Validations

### ❌ Bad: Only Waiting for Loading

```typescript
class DashboardPage extends BaseState {
  async validateState(): Promise<void> {
    // ❌ This doesn't verify UI state, just waits
    await this.page.waitForLoadState("networkidle");
  }
}
```

### ✅ Good: Real UI Assertions

```typescript
class DashboardPage extends BaseState {
  async validateState(): Promise<void> {
    // ✅ Verifies actual UI state
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.page.locator("h1")).toContainText("Dashboard");
    await expect(this.page.locator("[data-testid='dashboard-content']")).toBeVisible();
    
    // Optional: Wait for data to load
    await expect(this.page.locator("[data-testid='user-list']")).toBeVisible();
  }
}
```

## Using State Transitions Effectively

### ✅ Recommended: Use `dispatch()` for Navigation

```typescript
test("navigation flow", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  // ✅ Uses state machine for navigation
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  await executor.expectState("dashboard");
  
  await executor.navigateAndValidate("NAVIGATE_TO_SETTINGS");
  await executor.expectState("settings");
});
```

### ⚠️ Acceptable: Direct Navigation (with State Validation)

```typescript
test("dashboard functionality", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  // Navigate directly
  await app.dashboard.goto();
  
  // But still validate state
  await executor.expectState("dashboard");
  
  // Test dashboard-specific functionality
  await page.click("button");
});
```

### ❌ Avoid: Direct Navigation Without State Validation

```typescript
test("dashboard functionality", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  // ❌ Navigate directly without validating state
  await app.dashboard.goto();
  
  // State machine is now out of sync with UI
  // This defeats the purpose of using state model
});
```

## Reducing Boilerplate

### Before: Verbose Setup

```typescript
test("navigation", async ({ page }) => {
  const factory = createStateFactory(page);
  const executor = new ModelExecutor(page, appMachine, factory);
  
  await page.goto("https://example.com");
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("home");
  
  await executor.dispatch("NAVIGATE_TO_DASHBOARD");
  await executor.validateCurrentState();
  expect(executor.currentStateValue).toBe("dashboard");
});
```

### After: Cleaner with Convenience Methods

```typescript
test("navigation", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  await page.goto("https://example.com");
  await executor.expectState("home");
  
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  await executor.expectState("dashboard");
});
```

## Common Patterns

### Pattern 1: Navigation Flow Test

```typescript
test("complete navigation flow", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  await page.goto("https://example.com");
  await executor.expectState("home");
  
  // Navigate through states
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  await executor.navigateAndValidate("NAVIGATE_TO_SETTINGS");
  await executor.navigateAndValidate("NAVIGATE_TO_HOME");
  
  // Verify final state
  await executor.expectState("home");
});
```

### Pattern 2: State Persistence Test

```typescript
test("state persists across actions", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  
  // Perform actions
  await page.fill("input", "test");
  await page.click("button");
  
  // Verify still in correct state
  await executor.expectState("dashboard");
});
```

### Pattern 3: Invalid Transition Test

```typescript
test("invalid transitions are rejected", async ({ page }) => {
  const executor = createExecutor(page, appMachine, setupFactory);
  
  await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");
  
  // Attempt invalid transition
  await expect(
    executor.dispatch("NAVIGATE_TO_INVALID_STATE")
  ).rejects.toThrow();
  
  // Verify state unchanged
  await executor.expectState("dashboard");
});
```

## Troubleshooting

### Problem: State validation fails unexpectedly

**Solution**: Ensure `validateState()` contains real UI assertions, not just waits:

```typescript
// ❌ Bad
async validateState(): Promise<void> {
  await this.page.waitForLoadState("networkidle");
}

// ✅ Good
async validateState(): Promise<void> {
  await expect(this.page).toHaveURL(/\/dashboard/);
  await expect(this.page.locator("h1")).toBeVisible();
}
```

### Problem: State machine out of sync with UI

**Solution**: Always use `dispatch()` for navigation, or manually sync state:

```typescript
// ❌ Bad: Direct navigation without syncing state
await app.dashboard.goto();

// ✅ Good: Use dispatch
await executor.navigateAndValidate("NAVIGATE_TO_DASHBOARD");

// ✅ Also good: Direct navigation with validation
await app.dashboard.goto();
await executor.expectState("dashboard");
```

### Problem: Too much boilerplate

**Solution**: Use `createExecutor()` and convenience methods:

```typescript
// ❌ Verbose
const factory = createStateFactory(page);
const executor = new ModelExecutor(page, appMachine, factory);
await executor.dispatch("EVENT");
await executor.validateCurrentState();
expect(executor.currentStateValue).toBe("state");

// ✅ Concise
const executor = createExecutor(page, appMachine, setupFactory);
await executor.navigateAndValidate("EVENT");
await executor.expectState("state");
```

## Summary

**Key Takeaways:**

1. **Use state model for navigation/flow tests** - This is where it provides the most value
2. **Write real UI assertions** - Don't just wait for loading, verify actual UI state
3. **Use `dispatch()` for navigation** - Keep state machine in sync with UI
4. **Reduce boilerplate** - Use `createExecutor()` and convenience methods
5. **Don't force it** - Use direct navigation for simple page tests

The state model is a powerful tool when used correctly, but it's not required for every test. Use it where it adds value, and skip it where it doesn't.

