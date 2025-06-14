# Changelog

All notable changes to the VS Blue extension will be documented in this file.

## [2.0.0] - 2025-06-13

### Added

- Complete architectural overhaul with modular design
- New Canvas feature for data pipeline visualization
- Enhanced performance monitoring with real-time metrics
- Advanced memory management with leak detection
- TypeScript type safety throughout the codebase
- Comprehensive test suite
- GitHub Actions CI/CD pipeline
- Automated testing and deployment workflows
- Detailed documentation and contribution guidelines

### Changed

- Refactored performance monitoring system
- Updated all dependencies to latest versions
- Improved code organization and documentation
- Enhanced error handling and logging
- Restructured project for better maintainability
- Optimized build process
- Improved development tooling

### Fixed

- Resolved all TypeScript compilation errors
- Fixed memory management issues
- Addressed performance bottlenecks
- Fixed UI rendering issues in metrics display
- Improved error recovery and stability

## [1.1.1] - 2024-03-13

### Added
- Comprehensive Canvas feature for data pipeline visualization
- Enhanced performance monitoring with real-time metrics
- New memory management system with leak detection
- TypeScript type safety improvements throughout the codebase
- Modular architecture for better maintainability

### Changed
- Refactored performance monitoring system
- Updated dependencies to latest versions
- Improved code organization and documentation
- Enhanced error handling and logging

### Fixed
- Resolved TypeScript compilation errors
- Fixed memory management issues
- Addressed performance bottlenecks
- Fixed UI rendering issues in metrics display

## [1.1.1] - 2024-03-13

### Fixed

- Resolved all TypeScript errors related to metrics tracking, GC stats, and command registration.
- Removed or replaced all references to non-existent methods and properties in the extension and performance monitor.
- Ensured all metrics (including load history) are properly tracked and displayed in the HUD and webview panels.
- Fixed duplicate property declarations and improved initialization of metrics.
- Removed all calls to private or missing methods in the workflow manager.
- Improved codebase linting by adding curly braces to all flagged if statements (extension.ts, metricsHUD.ts).

### Added

- Registered new commands for detailed performance, memory, system, extension, editor, and GC views in the command palette and menus.
- Enhanced webview panels for in-depth performance analytics, including trend indicators and memory history charts.

### Changed

- Updated metrics tracking to use a unified PerformanceMetrics interface and consistent history management.
- Improved error handling and code comments for maintainability.

## [1.1.0] - 2024-03-12

### Added

- Professional logging system with log rotation and persistence.
- Comprehensive error handling system with automatic recovery.
- Enhanced memory management and optimization.
- Improved extension lifecycle management.
- New command to view extension logs.
- Better error reporting and user feedback.
- Automatic restart suggestions for error recovery.
- Enhanced REDCODE mode with better resource management.

### Enhanced

- Memory usage optimization across all components.
- Performance monitoring with detailed metrics.
- Resource cleanup and disposal.
- Error handling and recovery.
- Extension activation/deactivation flow.
- Component initialization and cleanup.
- Status bar item management.
- Overlay management with TTL and size limits.

### Fixed

- Memory leaks in overlay management.
- Resource cleanup during deactivation.
- Event listener disposal.
- Cache management.
- Performance monitoring accuracy.
- Error handling and recovery.
- Extension state management.

## [1.0.0] - 2024-03-01

### Added

- Initial release of VS Blue extension.
- Blue-Hand dark theme.
- Performance monitoring.
- Metrics HUD.
- IMF overlays.
- REDCODE mode.
- MacBook Pro optimizations.
- Canvas layout management.
- Icon generation.
- Profile menu.
- Settings management.

### Features

- Real-time performance monitoring.
- Resource usage tracking.
- Automatic optimizations.
- Customizable settings.
- Theme integration.
- Extension management.
- Profile customization.
- Icon generation.
- Layout management.
- Overlay system.

## [2.1.0] - 2025-06-14

### Added
- Deployed RedQueen MCP Contract Arbiter to Cloudflare Workers
- API key authentication for all mutating endpoints
- Bulk contract loader script with YAML/JSON id-based KV keying
- Auto-feeding contract watcher for seamless pipeline sync
- CLI client for contract fetch, claim, and drift reporting
- Trust decay logic and D1 schema for agent trust scores
- Full JSON-RPC 2.0 support for contract arbitration
- .env-based local secret management for CLI/dev

### Changed
- Standardized contract keying to use contract `id` field
- Improved error handling and validation in loader and server
- Updated documentation for secure secret storage and extension integration

### Fixed
- Resolved deployment and binding naming issues
- Ensured all pipeline steps are agentic, modular, and secure

## [2.1.1] - 2025-06-14

### Added
- Trust score endpoint `/trust/:agentId` and JSON-RPC method `getTrustScore`
- CLI support for fetching agent trust scores (REST and RPC)
- Contract schema validation and expiry check in loader script

### Changed
- Improved loader script to skip invalid/expired contracts

## [2.1.2] - 2025-06-15

### Added
- Background agent implementation with task queue management
- MCP (Master Control Program) server and client architecture
- Pre-commit hooks with Husky and lint-staged
- Code formatting with Prettier
- TypeScript-based MCP tool execution system
- Express-based MCP server with tool registration
- Task queue management in background agent
- Event-driven architecture for agent and MCP components

### Changed
- Updated development workflow with automated code formatting
- Enhanced code quality with pre-commit hooks
- Improved project structure with modular agent system

### Fixed
- Code style consistency through automated formatting
- Type safety improvements in MCP tool execution
