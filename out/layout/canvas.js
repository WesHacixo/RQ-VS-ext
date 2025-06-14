"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasLayoutManager = void 0;
class CanvasLayoutManager {
    constructor(context) {
        this.isFluidLayoutEnabled = false;
        this.customCSS = '';
        this.context = context;
        this.setupCustomCSS();
    }
    enableFluidLayout() {
        if (this.isFluidLayoutEnabled) {
            return;
        }
        this.isFluidLayoutEnabled = true;
        this.applyCanvasStyles();
        this.setupResizableElements();
        console.log('VS Blue: Fluid canvas layout enabled');
    }
    disableFluidLayout() {
        if (!this.isFluidLayoutEnabled) {
            return;
        }
        this.isFluidLayoutEnabled = false;
        this.removeCanvasStyles();
        console.log('VS Blue: Fluid canvas layout disabled');
    }
    setupCustomCSS() {
        this.customCSS = `
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

            .monaco-workbench .part.panel {
                border-radius: 8px !important;
                margin: 4px !important;
                background: var(--vscode-panel-background) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            }

            .monaco-workbench .part.activitybar {
                border-radius: 8px !important;
                margin: 4px !important;
                background: var(--vscode-activityBar-background) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            }

            .monaco-workbench .part.statusbar {
                border-radius: 8px !important;
                margin: 4px !important;
                background: var(--vscode-statusBar-background) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            }

            /* Smooth transitions */
            .monaco-workbench .part {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Resizable handles */
            .monaco-workbench .split-view-view {
                position: relative !important;
            }

            .monaco-workbench .split-view-view::after {
                content: '' !important;
                position: absolute !important;
                right: -2px !important;
                top: 0 !important;
                bottom: 0 !important;
                width: 4px !important;
                background: rgba(79, 124, 172, 0.3) !important;
                cursor: col-resize !important;
                opacity: 0 !important;
                transition: opacity 0.2s ease !important;
            }

            .monaco-workbench .split-view-view:hover::after {
                opacity: 1 !important;
            }

            /* Tab styling */
            .monaco-workbench .tabs-container .tab {
                border-radius: 6px 6px 0 0 !important;
                margin-right: 2px !important;
                background: var(--vscode-tab-inactiveBackground) !important;
                transition: all 0.2s ease !important;
            }

            .monaco-workbench .tabs-container .tab.active {
                background: var(--vscode-tab-activeBackground) !important;
                box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1) !important;
            }

            /* Scrollbar styling */
            .monaco-workbench .monaco-scrollable-element .scrollbar {
                border-radius: 4px !important;
            }

            .monaco-workbench .monaco-scrollable-element .slider {
                border-radius: 4px !important;
                background: rgba(79, 124, 172, 0.4) !important;
            }

            .monaco-workbench .monaco-scrollable-element .slider:hover {
                background: rgba(79, 124, 172, 0.6) !important;
            }

            /* Input styling */
            .monaco-workbench .monaco-inputbox {
                border-radius: 6px !important;
                border: 1px solid rgba(79, 124, 172, 0.3) !important;
                background: var(--vscode-input-background) !important;
            }

            .monaco-workbench .monaco-inputbox.synthetic-focus {
                border-color: rgba(79, 124, 172, 0.8) !important;
                box-shadow: 0 0 0 2px rgba(79, 124, 172, 0.2) !important;
            }

            /* Button styling */
            .monaco-workbench .monaco-button {
                border-radius: 6px !important;
                background: var(--vscode-button-background) !important;
                transition: all 0.2s ease !important;
            }

            .monaco-workbench .monaco-button:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
            }

            /* Dropdown styling */
            .monaco-workbench .monaco-dropdown {
                border-radius: 6px !important;
                background: var(--vscode-dropdown-background) !important;
                border: 1px solid rgba(79, 124, 172, 0.3) !important;
            }

            /* Context menu styling */
            .monaco-workbench .context-view .monaco-menu {
                border-radius: 8px !important;
                background: var(--vscode-menu-background) !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
                border: 1px solid rgba(79, 124, 172, 0.2) !important;
            }

            /* Notification styling */
            .monaco-workbench .notifications-toasts .notification-toast {
                border-radius: 8px !important;
                background: var(--vscode-notifications-background) !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
                border: 1px solid rgba(79, 124, 172, 0.2) !important;
            }

            /* Quick input styling */
            .monaco-workbench .quick-input-widget {
                border-radius: 12px !important;
                background: var(--vscode-quickInput-background) !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
                border: 1px solid rgba(79, 124, 172, 0.3) !important;
            }

            /* Terminal styling */
            .monaco-workbench .terminal-wrapper {
                border-radius: 8px !important;
                background: var(--vscode-terminal-background) !important;
                margin: 4px !important;
            }

            /* Editor group styling */
            .monaco-workbench .editor-group-container {
                border-radius: 8px !important;
                overflow: hidden !important;
            }

            /* Minimap styling */
            .monaco-workbench .minimap {
                border-radius: 0 8px 8px 0 !important;
                background: var(--vscode-minimap-background) !important;
            }

            /* Breadcrumb styling */
            .monaco-workbench .breadcrumbs-control {
                border-radius: 6px !important;
                background: rgba(79, 124, 172, 0.1) !important;
                margin: 2px 4px !important;
                padding: 2px 8px !important;
            }
        `;
    }
    applyCanvasStyles() {
        // Create or update style element
        let styleElement = document.getElementById('vs-blue-canvas-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'vs-blue-canvas-styles';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = this.customCSS;
    }
    removeCanvasStyles() {
        const styleElement = document.getElementById('vs-blue-canvas-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
    setupResizableElements() {
        // Add resize functionality to panels
        const observer = new MutationObserver(() => {
            this.enhanceResizeHandles();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    enhanceResizeHandles() {
        const resizeHandles = document.querySelectorAll('.split-view-view');
        resizeHandles.forEach(handle => {
            if (!handle.classList.contains('vs-blue-enhanced')) {
                handle.classList.add('vs-blue-enhanced');
                handle.addEventListener('mouseenter', () => {
                    handle.classList.add('vs-blue-hover');
                });
                handle.addEventListener('mouseleave', () => {
                    handle.classList.remove('vs-blue-hover');
                });
            }
        });
    }
    dispose() {
        this.removeCanvasStyles();
    }
}
exports.CanvasLayoutManager = CanvasLayoutManager;
//# sourceMappingURL=canvas.js.map