# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
