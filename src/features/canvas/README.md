# VS Blue - Canvas Feature

This module provides a flexible, fluid canvas layout system for VS Blue's data pipeline visualization, enabling dynamic arrangement and visualization of complex workflows within the VS Code interface.

## Overview

The Canvas feature offers a powerful way to visualize and interact with data pipelines, code flows, and other structured information. It's built with performance and extensibility in mind, featuring:

- **Fluid Layout**: Dynamic arrangement of elements that adapts to available space
- **Custom Styling**: Apply custom CSS for complete visual control
- **Interactive Elements**: Support for nodes, edges, and panels
- **Type Safety**: Built with TypeScript for better developer experience

## Architecture

### Core Components

- **`CanvasLayoutManager`**: Central class that manages the canvas state and layout
- **`CanvasElement`**: Interface defining the structure of canvas elements
- **`CanvasOptions`**: Configuration interface for customizing canvas behavior

### Type Definitions

All types are defined in `types/index.ts`:

- `CanvasOptions`: Configuration options for the canvas
- `CanvasElement`: Interface for canvas elements (nodes, edges, etc.)
- `CanvasLayoutManagerInterface`: Public API of the CanvasLayoutManager

## Installation

1. Ensure you have the latest version of VS Blue extension installed
2. The Canvas feature is included by default - no additional installation needed

## Configuration

Configure the Canvas feature through the `CanvasOptions` interface when initializing:

```typescript
const options: CanvasOptions = {
  enableFluidLayout: true,  // Enable fluid layout mode
  customCSS: `
    .canvas-node {
      border-radius: 4px;
      background: var(--vscode-editor-background);
    }
  `,
  debug: false  // Enable debug logging
};

const canvas = new CanvasLayoutManager(context, options);
```

## Usage

### Basic Initialization

```typescript
import { CanvasLayoutManager } from './canvas/CanvasLayoutManager';
import { ExtensionContext } from 'vscode';

// Initialize in your extension's activate function
export function activate(context: ExtensionContext) {
  const canvas = new CanvasLayoutManager(context, {
    enableFluidLayout: true
  });
  
  // Add elements to the canvas
  canvas.addElement({
    id: 'node-1',
    type: 'node',
    position: { x: 100, y: 100, width: 200, height: 100 },
    label: 'Processing Node',
    color: '#4CAF50'
  });
}
```

### Adding Elements

```typescript
// Add a node
canvas.addElement({
  id: 'data-source',
  type: 'node',
  position: { x: 50, y: 50, width: 150, height: 80 },
  label: 'Data Source',
  icon: 'database'
});

// Add a connection between nodes
canvas.addElement({
  id: 'conn-1',
  type: 'edge',
  source: 'data-source',
  target: 'processing-node',
  label: 'Data Flow'
});
```

### Layout Management

```typescript
// Enable fluid layout
canvas.enableFluidLayout();

// Disable fluid layout
canvas.disableFluidLayout();

// Apply custom CSS
canvas.updateCSS(`
  .canvas-node {
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
  }
  
  .canvas-node:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
`);
```

## API Reference

### CanvasLayoutManager

#### Constructor

```typescript
new CanvasLayoutManager(context: vscode.ExtensionContext, options?: CanvasOptions)
```

#### Methods

- `enableFluidLayout()`: Enables fluid layout mode
- `disableFluidLayout()`: Disables fluid layout mode
- `addElement(element: CanvasElement)`: Adds an element to the canvas
- `removeElement(id: string)`: Removes an element by ID
- `updateElement(id: string, updates: Partial<CanvasElement>)`: Updates an element
- `getElement(id: string): CanvasElement | undefined`: Retrieves an element by ID
- `updateCSS(css: string)`: Applies custom CSS to the canvas
- `dispose()`: Cleans up resources

### CanvasElement

```typescript
{
  id: string;                    // Unique identifier
  type: 'node' | 'edge' | 'group' | 'panel';
  position: {                    // Position and dimensions
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  [key: string]: any;           // Additional custom properties
}
```

## Examples

### Creating a Simple Flow

```typescript
// Add source node
canvas.addElement({
  id: 'source',
  type: 'node',
  position: { x: 50, y: 100, width: 120, height: 60 },
  label: 'Source Data',
  icon: 'database'
});

// Add processor node
canvas.addElement({
  id: 'processor',
  type: 'node',
  position: { x: 250, y: 100, width: 120, height: 60 },
  label: 'Process',
  icon: 'settings'
});

// Add connection
canvas.addElement({
  id: 'conn1',
  type: 'edge',
  source: 'source',
  target: 'processor',
  label: 'process',
  arrow: 'right'
});
```

## Best Practices

1. **Element IDs**: Always use unique, descriptive IDs for elements
2. **Performance**: For complex visualizations, batch element updates when possible
3. **Error Handling**: Always check if elements exist before manipulating them
4. **Cleanup**: Call `dispose()` when the canvas is no longer needed

## Debugging

Enable debug mode to get detailed logs about canvas operations:

```typescript
const canvas = new CanvasLayoutManager(context, {
  debug: true
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

```typescript
import { CanvasLayoutManager } from './canvas';

// Initialize the canvas
const canvas = new CanvasLayoutManager(context);

// Enable fluid layout
canvas.enableFluidLayout();

// Disable when done
// canvas.disableFluidLayout();
```

## Development

### Adding New Components
1. Create a new file in `components/`
2. Export the component as a named export
3. Add any necessary types to `types/`
4. Document the component with JSDoc comments

### Styling
Use CSS variables for theming to ensure consistency with VS Code's theming system.

## Future Enhancements

- [ ] Add support for custom layouts
- [ ] Implement data pipeline visualization
- [ ] Add zoom/pan functionality
- [ ] Support for saving/loading layouts

## License

This project is licensed under the terms of the [MIT License](LICENSE).
