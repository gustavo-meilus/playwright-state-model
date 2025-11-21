# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Enhanced Error Messages** - `StateValidationError` class with rich context (expected state, current state, URL, validation chain, original error)
- **State Value String Getter** - `currentStateString` property for consistent string-based state comparisons
- **Event Payload Support** - `getPayload<T>()` method in `BaseState` for type-safe access to event payloads in Page Object handlers
- **Built-in Retry Logic** - `RetryOptions` interface and retry support in `navigateAndValidate()` for flaky navigation scenarios
- **Screenshot on Failure** - Automatic screenshot capture on validation failures via `screenshotOnFailure` option
- **Bulk State Registration** - `registerStates()` method in `StateFactory` for registering multiple states at once
- **ModelExecutorOptions** - Comprehensive options interface for configuring ModelExecutor behavior
- **State Value Format Options** - Configurable state value format (`'object'`, `'string'`, or `'auto'`)

### Changed

- Enhanced `expectState()` with improved error messages using `StateValidationError`
- Enhanced `navigateAndValidate()` with retry support and better error handling
- Updated `createExecutor()` to accept `ModelExecutorOptions`
- Improved `validateCurrentState()` error messages with full context
- `dispatch()` now sets event payload in all states in chain before handler execution

### Documentation

- Added `IMPROVEMENTS_IMPLEMENTED.md` documenting all feedback-based improvements

## [1.1.4] - 2024-12-XX

### Added

- **`gotoState()` method** - Navigate directly to a target state through Page Object's `goto()` method, providing state-machine-aware navigation alternative to direct `page.goto()` calls
- **`syncStateFromPage()` method** - Detect current page state and verify state machine synchronization, useful for debugging state mismatches when navigation happens outside the state machine
- **Enhanced `expectState()` method** - Added optional `strict` mode for additional UI validation (though validation already includes UI checks)
- **`getRegisteredStates()` method** - Added to `StateFactory` to retrieve all registered state IDs for state discovery and synchronization

### Changed

- Improved `expectState()` with optional validation options parameter
- Enhanced error messages in `gotoState()` to guide users toward proper state transition patterns
- Updated `BaseState` documentation to emphasize that `validateState()` should include real UI assertions, not just loading waits

### Documentation

- Updated README API reference with new methods
- Added guidance on when to use `gotoState()` vs `navigateAndValidate()`

## [1.1.3] - 2024-11-21

### Added

- **`createExecutor()` convenience function** - Reduces boilerplate by combining StateFactory creation and ModelExecutor initialization in a single call
- **`navigateAndValidate()` method** - Convenience method that combines `dispatch()` and `validateCurrentState()` for cleaner test code
- **`expectState()` method** - Validates current state and asserts state value matches expected, combining validation and assertion in one call
- **Enhanced error messages** - `validateCurrentState()` now provides detailed error messages including which state failed, current state value, and full validation chain
- **Usage Guide** - New `USAGE_GUIDE.md` with best practices, when to use state model vs direct navigation, and troubleshooting tips

### Changed

- Improved `validateCurrentState()` error messages with better context and debugging information
- Updated README with best practices section and examples using new convenience methods
- Example tests updated to demonstrate new convenience methods

### Documentation

- Added comprehensive usage guide covering best practices and common patterns
- Updated README with guidance on when to use state model vs direct navigation
- Added examples showing reduced boilerplate with new convenience methods

## [1.1.2] - 2024-11-21

### Fixed

- **Critical**: Fixed XState v5 initialization failure in Playwright test environments
- Replaced dynamic `require("xstate")` with safer initialization approach
- Always fallback to `interpret()` which works in both CJS and ESM contexts
- Improved error messages for initialization failures

### Changed

- Improved `getCreateActor()` function to handle both CJS and ESM environments
- Better detection of XState v4 vs v5 by checking result properties

## [1.1.1] - 2024-11-21

### Fixed

- Improved XState v5 compatibility - fixed invalid event handling
- Fixed state value resolution for undefined values
- Updated dependencies to latest versions (XState v5.24.0, @types/node v24.10.1)

### Changed

- Enhanced error messages for better debugging
- Improved invalid event handling (XState silently ignores invalid transitions)

## [1.1.0] - 2024-11-21

### Added

- **XState v5 Support**: Automatic detection and support for both XState v4 and v5 APIs
- Dual API compatibility - uses `createActor()` for v5, falls back to `interpret()` for v4
- Runtime version detection - no code changes needed when upgrading XState

### Changed

- Updated devDependencies to use XState v5.24.0 for testing
- ModelExecutor now handles both XState v4 service and v5 actor APIs
- Improved error handling for initialization failures

## [1.0.0] - 2024-11-21

### Added

- Initial release
- `BaseState` abstract class for Page Objects
- `StateFactory` for mapping XState states to Page Objects
- `ModelExecutor` for orchestrating state machine execution
- `ActionLocator` for smart locator bindings
- Hierarchical state resolution
- Event bubbling (bottom-up traversal)
- State validation (top-down composition)
- Context injection for data-driven testing
- Full TypeScript support
- Example project demonstrating usage

[Unreleased]: https://github.com/gustavo-meilus/playwright-state-model/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gustavo-meilus/playwright-state-model/releases/tag/v1.0.0
