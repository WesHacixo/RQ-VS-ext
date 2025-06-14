"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMFOverlayManager = void 0;
const vscode = __importStar(require("vscode"));
class IMFOverlayManager {
    constructor(context) {
        this.isEnabled = false;
        this.overlayElements = new Map();
        this.disposables = [];
        this.MAX_OVERLAYS = 100; // Maximum number of overlays to maintain
        this.OVERLAY_TTL = 5000; // Time to live for overlays in milliseconds
        this.overlayTimestamps = new Map();
        this.UPDATE_INTERVAL = 1000; // Check for stale overlays every second
        this.context = context;
        this.setupDecorations();
    }
    enable() {
        if (this.isEnabled) {
            return;
        }
        this.isEnabled = true;
        this.createOverlays();
        this.setupEventListeners();
        this.startOverlayCleanup();
        console.log('VS Blue: IMF Overlays enabled');
    }
    disable() {
        if (!this.isEnabled) {
            return;
        }
        this.isEnabled = false;
        this.removeOverlays();
        this.removeEventListeners();
        this.stopOverlayCleanup();
        console.log('VS Blue: IMF Overlays disabled');
    }
    toggle() {
        if (this.isEnabled) {
            this.disable();
        }
        else {
            this.enable();
        }
    }
    setupDecorations() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '',
                color: '#4f7cac',
                fontStyle: 'italic',
                margin: '0 0 0 1em'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }
    createOverlays() {
        this.createCodeLensOverlay();
        this.createInlineHintsOverlay();
        this.createHighlightOverlay();
        this.createMetadataOverlay();
    }
    createCodeLensOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'vs-blue-codelens-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(26, 31, 46, 0.9);
            border: 1px solid rgba(79, 124, 172, 0.3);
            border-radius: 8px;
            padding: 8px 12px;
            color: #e1e5f2;
            font-family: 'Inter Rounded', monospace;
            font-size: 12px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            opacity: 0;
            pointer-events: none;
        `;
        overlay.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #4f7cac;">●</span>
                <span>Code Analysis Active</span>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlayElements.set('codelens', overlay);
        // Show overlay when hovering over code
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
    }
    createInlineHintsOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'vs-blue-hints-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(26, 31, 46, 0.9);
            border: 1px solid rgba(79, 124, 172, 0.3);
            border-radius: 8px;
            padding: 8px 12px;
            color: #e1e5f2;
            font-family: 'Inter Rounded', monospace;
            font-size: 11px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            max-width: 300px;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="margin-bottom: 4px; color: #4f7cac; font-weight: 600;">
                Development Hints
            </div>
            <div style="font-size: 10px; line-height: 1.4;">
                • Cmd+Shift+M: Toggle Metrics HUD<br>
                • Cmd+Shift+C: Toggle Canvas Mode<br>
                • Auto REDCODE at 85% resource usage
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlayElements.set('hints', overlay);
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 200);
    }
    createHighlightOverlay() {
        // Create highlight overlay for semantic highlighting
        const style = document.createElement('style');
        style.id = 'vs-blue-highlight-overlay';
        style.textContent = `
            .vs-blue-semantic-highlight {
                background: rgba(79, 124, 172, 0.1) !important;
                border-radius: 3px !important;
                box-shadow: 0 0 0 1px rgba(79, 124, 172, 0.2) !important;
                transition: all 0.2s ease !important;
            }

            .vs-blue-semantic-highlight:hover {
                background: rgba(79, 124, 172, 0.2) !important;
                box-shadow: 0 0 0 1px rgba(79, 124, 172, 0.4) !important;
            }

            .vs-blue-error-highlight {
                background: rgba(224, 108, 117, 0.1) !important;
                border-radius: 3px !important;
                box-shadow: 0 0 0 1px rgba(224, 108, 117, 0.3) !important;
            }

            .vs-blue-warning-highlight {
                background: rgba(229, 192, 123, 0.1) !important;
                border-radius: 3px !important;
                box-shadow: 0 0 0 1px rgba(229, 192, 123, 0.3) !important;
            }

            .vs-blue-info-highlight {
                background: rgba(79, 124, 172, 0.1) !important;
                border-radius: 3px !important;
                box-shadow: 0 0 0 1px rgba(79, 124, 172, 0.3) !important;
            }
        `;
        document.head.appendChild(style);
        this.overlayElements.set('highlight', style);
    }
    createMetadataOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'vs-blue-metadata-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            background: rgba(26, 31, 46, 0.9);
            border: 1px solid rgba(79, 124, 172, 0.3);
            border-radius: 8px;
            padding: 12px;
            color: #e1e5f2;
            font-family: 'Inter Rounded', monospace;
            font-size: 11px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: none;
            min-width: 200px;
        `;
        this.updateMetadataContent(overlay);
        document.body.appendChild(overlay);
        this.overlayElements.set('metadata', overlay);
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 300);
    }
    updateMetadataContent(overlay) {
        const activeEditor = vscode.window.activeTextEditor;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        overlay.innerHTML = `
            <div style="margin-bottom: 8px; color: #4f7cac; font-weight: 600;">
                Workspace Metadata
            </div>
            <div style="font-size: 10px; line-height: 1.4;">
                <div style="margin-bottom: 4px;">
                    <span style="color: #7c8db5;">File:</span>
                    ${activeEditor?.document.fileName.split('/').pop() || 'None'}
                </div>
                <div style="margin-bottom: 4px;">
                    <span style="color: #7c8db5;">Language:</span>
                    ${activeEditor?.document.languageId || 'None'}
                </div>
                <div style="margin-bottom: 4px;">
                    <span style="color: #7c8db5;">Lines:</span>
                    ${activeEditor?.document.lineCount || 0}
                </div>
                <div style="margin-bottom: 4px;">
                    <span style="color: #7c8db5;">Workspace:</span>
                    ${workspaceFolder?.name || 'None'}
                </div>
                <div style="margin-bottom: 4px;">
                    <span style="color: #7c8db5;">Theme:</span>
                    Blue-Hand Dark
                </div>
            </div>
        `;
    }
    setupEventListeners() {
        // Monitor active editor changes
        const editorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateOverlays();
        });
        // Monitor selection changes
        const selectionDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
            this.updateOverlays();
        });
        // Monitor document changes
        const documentDisposable = vscode.workspace.onDidChangeTextDocument(() => {
            this.updateOverlays();
        });
        this.disposables.push(editorDisposable, selectionDisposable, documentDisposable);
    }
    startOverlayCleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.cleanupStaleOverlays(), this.UPDATE_INTERVAL);
    }
    stopOverlayCleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
    }
    cleanupStaleOverlays() {
        const now = Date.now();
        for (const [key, timestamp] of this.overlayTimestamps.entries()) {
            if (now - timestamp > this.OVERLAY_TTL) {
                this.removeOverlay(key);
            }
        }
        // If we have too many overlays, remove the oldest ones
        if (this.overlayElements.size > this.MAX_OVERLAYS) {
            const entries = Array.from(this.overlayTimestamps.entries())
                .sort((a, b) => a[1] - b[1]);
            const toRemove = entries.slice(0, entries.length - this.MAX_OVERLAYS);
            toRemove.forEach(([key]) => this.removeOverlay(key));
        }
    }
    removeOverlay(key) {
        const element = this.overlayElements.get(key);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        this.overlayElements.delete(key);
        this.overlayTimestamps.delete(key);
    }
    updateOverlays() {
        if (!this.isEnabled) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const selections = editor.selections;
        // Update existing overlays
        for (const selection of selections) {
            const key = this.getOverlayKey(document, selection);
            const now = Date.now();
            if (this.overlayElements.has(key)) {
                this.overlayTimestamps.set(key, now);
                this.updateOverlayPosition(key, selection);
            }
            else {
                this.createOverlay(key, selection);
            }
        }
        // Remove overlays for unselected regions
        for (const key of this.overlayElements.keys()) {
            if (!this.isOverlaySelected(key, Array.from(selections))) {
                this.removeOverlay(key);
            }
        }
    }
    getOverlayKey(document, selection) {
        return `${document.uri.toString()}-${selection.start.line}-${selection.start.character}`;
    }
    isOverlaySelected(key, selections) {
        return selections.some(selection => {
            const [uri, line, char] = key.split('-');
            return selection.start.line === parseInt(line) &&
                selection.start.character === parseInt(char);
        });
    }
    createOverlay(key, selection) {
        const element = document.createElement('div');
        element.className = 'vsblue-overlay';
        // Add your overlay styling and content here
        document.body.appendChild(element);
        this.overlayElements.set(key, element);
        this.overlayTimestamps.set(key, Date.now());
        this.updateOverlayPosition(key, selection);
    }
    updateOverlayPosition(key, selection) {
        const element = this.overlayElements.get(key);
        if (!element) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const position = editor.document.positionAt(selection.start.character);
        const coords = editor.document.positionAt(selection.start.character);
        const range = new vscode.Range(coords, coords);
        const rect = editor.document.getWordRangeAtPosition(coords);
        if (rect) {
            const top = editor.document.positionAt(rect.start.character);
            const bottom = editor.document.positionAt(rect.end.character);
            const topCoords = editor.document.positionAt(top.character);
            const bottomCoords = editor.document.positionAt(bottom.character);
            element.style.top = `${topCoords.line}px`;
            element.style.left = `${topCoords.character}px`;
            element.style.height = `${bottomCoords.line - topCoords.line}px`;
        }
    }
    removeOverlays() {
        this.overlayElements.forEach((element, key) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.overlayElements.clear();
        this.overlayTimestamps.clear();
    }
    removeEventListeners() {
        // Clear decorations
        if (this.decorationType) {
            vscode.window.visibleTextEditors.forEach(editor => {
                editor.setDecorations(this.decorationType, []);
            });
        }
        // Dispose all event listeners
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    dispose() {
        this.disable();
        if (this.decorationType) {
            this.decorationType.dispose();
        }
    }
}
exports.IMFOverlayManager = IMFOverlayManager;
//# sourceMappingURL=imfOverlays.js.map