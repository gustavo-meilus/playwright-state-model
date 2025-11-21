# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
