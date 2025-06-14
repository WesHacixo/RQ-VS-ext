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
