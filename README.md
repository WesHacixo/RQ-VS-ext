# VS Blue 🚀

A comprehensive performance optimization and development productivity extension for VS Code, featuring advanced monitoring, visualization, and optimization tools.

![VS Blue Demo](media/demo.gif)

## 🚀 Quick Start

1. **Install the Extension**
   - Install from VS Code Marketplace: [VS Blue](https://marketplace.visualstudio.com/items?itemName=vs-blue.performance)
   - Or build from source (see Development section below)

2. **Key Features**
   - **Performance HUD**: Real-time metrics overlay
   - **Canvas**: Visual data pipeline builder
   - **Memory Management**: Advanced optimization and leak detection
   - **TypeScript-First**: Fully typed codebase
   - **Modular Architecture**: Easy to extend and maintain

## ✨ Features

### 🎨 Canvas
- Visual data pipeline builder
- Drag-and-drop interface for workflow design
- Real-time preview and debugging

### 📊 Performance Monitoring
- Real-time CPU and memory usage
- Extension impact analysis
- Historical metrics and trends
- Customizable dashboard

### 🧠 Memory Management
- Advanced leak detection
- Automatic optimization
- Garbage collection insights
- Memory usage visualization

### ⚙️ Developer Tools
- TypeScript type safety
- Comprehensive test suite
- GitHub Actions CI/CD
- Detailed documentation
- Time-based performance insights
- Memory pressure indicators
- Garbage collection monitoring

### Memory Optimization

- Smart garbage collection
- Extension management
- Cache optimization
- Workspace cleanup
- Automatic memory pressure handling
- REDCODE mode for critical situations

### Two Operation Modes

1. **VS Blue Mode** (Normal)
   - Balanced performance
   - Non-intrusive optimizations
   - Real-time monitoring
   - Smart cache management

2. **REDCODE Mode** (Aggressive)
   - Maximum performance
   - Aggressive memory management
   - Extension optimization
   - Cache clearing
   - Workspace settings optimization

## Installation Options 🎁

### Option 1: Manual Installation (Recommended)

1. Download the `.vsix` file from [releases](https://github.com/yourusername/vs-blue/releases)
2. In VS Code/Cursor: `Cmd+Shift+P` → "Install from VSIX"
3. Select the downloaded `.vsix` file

### Option 2: GitHub Clone (For Developers)

```bash
git clone https://github.com/yourusername/vs-blue.git
cd vs-blue
pnpm install
pnpm run package
```

### Option 3: Build from Source

```bash
git clone https://github.com/yourusername/vs-blue.git
cd vs-blue
pnpm install
pnpm run compile
```

## Performance Tips 💡

1. **Regular Maintenance**
   - Run "Optimize Workspace" every few hours
   - Check the Performance HUD for insights
   - Monitor extension impact
   - Watch for memory pressure indicators

2. **REDCODE Mode Usage**
   - Enable for large projects
   - Use when experiencing slowdowns
   - Great for resource-intensive tasks
   - Monitor memory pressure levels

3. **Best Practices**
   - Keep extensions up to date
   - Monitor memory usage patterns
   - Use workspace-specific settings
   - Watch for memory leak warnings

## Troubleshooting 🔧

### Common Issues

1. **Extension Not Working**
   - Try restarting VS Code/Cursor
   - Check if REDCODE mode is enabled
   - Verify installation
   - Check extension logs

2. **High Memory Usage**
   - Run "Optimize Workspace"
   - Check for memory leaks in Performance HUD
   - Consider enabling REDCODE mode
   - Monitor memory pressure indicators

3. **Performance Issues**
   - Monitor CPU usage in Performance HUD
   - Check extension impact
   - Optimize workspace settings
   - Look for memory pressure warnings

## Contributing 🤝

We welcome contributions! Here's how you can help:

- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

## License 📄

MIT License - feel free to use, modify, and share!

## Support 💬

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/vs-blue/issues)
- Discord: [Join our community](https://discord.gg/vs-blue)

---

Made with ❤️ for developers who value performance

# RedQueen Agent Console

A modular, scalable agent console for VS Code and Cursor, designed for advanced task management, agent orchestration, and developer productivity. Built for extensibility, cloud integration, and robust CI/CD workflows.

## Features

- Modular agent task queue (MCP)
- Feature flag system for dev/experimental toggles
- Real-time overlays and drift tracking (dev/experimental)
- Cloud test mode and GCP/Firebase deploy stubs
- CLI and scriptable build/test tools
- GitHub Actions for CI/CD, lint, and VSCE validation

## Folder Structure

```
/agent-scripts      # Custom agent scripts and utilities
/docs               # Documentation and architecture diagrams
/scripts            # CLI and dev scripts
/src                # Source code (extension, UI, backend)
  /config           # Feature flags and config
  /mcp              # MCP task commands and schema
  /ui               # UI components (AgentConsoleSidebar, overlays, etc)
/tests              # Unit and integration tests
```

## Feature Flags

Feature toggles are defined in `src/config/FEATURE_FLAGS.ts`:

```ts
export const FEATURES = {
  MCP_TASK_QUEUE: true,
  DEV_OVERLAYS: false,
  AGENT_LOOP: true,
  SR_DRIFT_TRACKER: true,
  REFLEX_LOOP: false,
};
```

Use these to gate dev/experimental features in the UI and backend.

## Build & Test

- `pnpm install` — install dependencies
- `pnpm run compile` — build the extension
- `pnpm run test` — run tests
- `pnpm run package` — create VSIX package

## GitHub Actions

- Lint, Prettier, and VSCE validation workflows in `.github/workflows/`

## Contributing

- Fork, branch, and PR as usual
- See `/CONTRIBUTING.md` for guidelines
- Use feature flags for dev/experimental code

---

MIT License
