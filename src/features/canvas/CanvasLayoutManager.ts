import * as vscode from 'vscode';
import { CanvasOptions, CanvasElement } from './types';

/**
 * Manages the layout and rendering of the VS Blue canvas
 * 
 * The CanvasLayoutManager handles the visual arrangement of elements
 * in the VS Code workbench, providing a fluid and customizable
 * layout system for data pipeline visualization.
 */
export class CanvasLayoutManager {
    private context: vscode.ExtensionContext;
    private isFluidLayoutEnabled: boolean = false;
    private customCSS: string = '';
    private debug: boolean = false;
    private elements: Map<string, CanvasElement> = new Map();
    private styleElement: vscode.Disposable | null = null;

    /**
     * Creates a new CanvasLayoutManager instance
     * @param context The extension context
     * @param options Configuration options
     */
    constructor(context: vscode.ExtensionContext, options: CanvasOptions = {}) {
        this.context = context;
        this.isFluidLayoutEnabled = options.enableFluidLayout || false;
        this.customCSS = options.customCSS || '';
        this.debug = options.debug || false;
        
        this.setupCustomCSS();
        
        if (this.debug) {
            console.log('VS Blue: CanvasLayoutManager initialized', {
                isFluidLayoutEnabled: this.isFluidLayoutEnabled,
                hasCustomCSS: !!this.customCSS
            });
        }
    }

    /**
     * Enables fluid layout mode
     */
    public enableFluidLayout(): void {
        if (this.isFluidLayoutEnabled) {
            if (this.debug) {
                console.log('VS Blue: Fluid layout already enabled');
            }
            return;
        }

        this.isFluidLayoutEnabled = true;
        this.applyCanvasStyles();
        this.setupResizableElements();
        
        if (this.debug) {
            console.log('VS Blue: Fluid canvas layout enabled');
        }
    }

    /**
     * Disables fluid layout mode
     */
    public disableFluidLayout(): void {
        if (!this.isFluidLayoutEnabled) {
            if (this.debug) {
                console.log('VS Blue: Fluid layout not currently enabled');
            }
            return;
        }

        this.isFluidLayoutEnabled = false;
        this.removeCanvasStyles();
        
        if (this.debug) {
            console.log('VS Blue: Fluid canvas layout disabled');
        }
    }

    /**
     * Adds an element to the canvas
     * @param element The element to add
     */
    public addElement(element: CanvasElement): void {
        if (this.elements.has(element.id)) {
            if (this.debug) {
                console.warn(`VS Blue: Element with ID '${element.id}' already exists`);
            }
            return;
        }

        this.elements.set(element.id, element);
        
        if (this.debug) {
            console.log('VS Blue: Added element', element);
        }
    }

    /**
     * Removes an element from the canvas
     * @param elementId The ID of the element to remove
     */
    public removeElement(elementId: string): void {
        if (!this.elements.has(elementId)) {
            if (this.debug) {
                console.warn(`VS Blue: No element with ID '${elementId}' found`);
            }
            return;
        }

        this.elements.delete(elementId);
        
        if (this.debug) {
            console.log('VS Blue: Removed element', elementId);
        }
    }

    /**
     * Updates an existing element
     * @param elementId The ID of the element to update
     * @param updates The updates to apply
     */
    public updateElement(elementId: string, updates: Partial<CanvasElement>): void {
        const element = this.elements.get(elementId);
        if (!element) {
            if (this.debug) {
                console.warn(`VS Blue: Cannot update non-existent element '${elementId}'`);
            }
            return;
        }

        this.elements.set(elementId, { ...element, ...updates });
        
        if (this.debug) {
            console.log('VS Blue: Updated element', elementId, updates);
        }
    }

    /**
     * Clears all elements from the canvas
     */
    public clear(): void {
        const count = this.elements.size;
        this.elements.clear();
        
        if (this.debug) {
            console.log(`VS Blue: Cleared ${count} elements from canvas`);
        }
    }

    /**
     * Disposes of resources used by the canvas
     */
    public dispose(): void {
        this.removeCanvasStyles();
        this.elements.clear();
        
        if (this.styleElement) {
            this.styleElement.dispose();
            this.styleElement = null;
        }
        
        if (this.debug) {
            console.log('VS Blue: CanvasLayoutManager disposed');
        }
    }

    // Private methods
    
    private setupCustomCSS(): void {
        const baseStyles = `
            /* VS Blue Canvas Layout Styles */
            .monaco-workbench {
                border-radius: 12px !important;
                overflow: hidden !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            }

            .monaco-workbench .part.editor {
                border-radius: 8px !important;
                margin: 4px !important;
                background: var(--vscode-editor-background) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            }

            .monaco-workbench .part.sidebar {
                border-radius: 8px !important;
                margin: 4px !important;
                background: var(--vscode-sideBar-background) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            }
        `;

        this.customCSS = `${baseStyles}${this.customCSS}`;
    }

    private applyCanvasStyles(): void {
        if (this.styleElement) {
            this.styleElement.dispose();
        }

        const styleSheet = document.createElement('style');
        styleSheet.id = 'vsblue-canvas-styles';
        styleSheet.textContent = this.customCSS;
        
        document.head.appendChild(styleSheet);
        
        this.styleElement = {
            dispose: () => {
                if (document.head.contains(styleSheet)) {
                    document.head.removeChild(styleSheet);
                }
            }
        };
    }

    private removeCanvasStyles(): void {
        if (this.styleElement) {
            this.styleElement.dispose();
            this.styleElement = null;
        }
    }

    private setupResizableElements(): void {
        // TODO: Implement resizable elements functionality
        // This will be used to make panels and other elements resizable
        // within the fluid layout
    }
}
