import * as vscode from 'vscode';

export interface CanvasOptions {
  /**
   * Whether to enable fluid layout by default
   * @default false
   */
  enableFluidLayout?: boolean;
  
  /**
   * Custom CSS to apply to the canvas
   * @default ''
   */
  customCSS?: string;
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

export interface CanvasElement {
  /** Unique identifier for the element */
  id: string;
  
  /** Element type */
  type: 'node' | 'edge' | 'group' | 'panel';
  
  /** Position and dimensions */
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  
  /** Additional properties */
  [key: string]: any;
}

export interface CanvasLayoutManagerInterface {
  /**
   * Enable fluid layout mode
   */
  enableFluidLayout(): void;
  
  /**
   * Disable fluid layout mode
   */
  disableFluidLayout(): void;
  
  /**
   * Add an element to the canvas
   * @param element The element to add
   */
  addElement(element: CanvasElement): void;
  
  /**
   * Remove an element from the canvas
   * @param elementId The ID of the element to remove
   */
  removeElement(elementId: string): void;
  
  /**
   * Update an existing element
   * @param elementId The ID of the element to update
   * @param updates The updates to apply
   */
  updateElement(elementId: string, updates: Partial<CanvasElement>): void;
  
  /**
   * Clear all elements from the canvas
   */
  clear(): void;
}
