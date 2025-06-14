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
exports.PerformanceViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class PerformanceViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview();
        // Listen for button messages
        webviewView.webview.onDidReceiveMessage(async (data) => {
            if (data.type === 'restart') {
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
            else if (data.type === 'update') {
                vscode.window.showInformationMessage('VS Blue: Update feature coming soon!');
            }
        });
        this._startUpdates();
        webviewView.onDidDispose(() => {
            this._stopUpdates();
        });
    }
    _startUpdates() {
        this._stopUpdates();
        this._updateInterval = setInterval(() => {
            if (this._view) {
                // Generate fake data
                const metrics = {
                    cpu: (Math.random() * 100).toFixed(1),
                    memory: (Math.random() * 16 * 1024).toFixed(1) // up to 16GB in MB
                };
                this._view.webview.postMessage({
                    type: 'updateMetrics',
                    metrics
                });
            }
        }, 1000);
    }
    _stopUpdates() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = undefined;
        }
    }
    _getHtmlForWebview() {
        // Temporarily stubbed out feature flags. These will be re-enabled once the feature flags are properly defined.
        // const restartButton = featureFlags.restartButton ? ... : '';
        // const updateButton = featureFlags.updateButton ? ... : '';
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 32px;
                }
                .metric {
                    font-size: 2em;
                    margin-bottom: 1em;
                }
                .label {
                    font-size: 1em;
                    color: var(--vscode-descriptionForeground);
                }
                .actions {
                    margin-top: 2em;
                    display: flex;
                    gap: 1em;
                }
                .action-btn {
                    font-family: var(--vscode-font-family);
                    font-size: 1em;
                    padding: 8px 18px;
                    border-radius: 4px;
                    border: none;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .action-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="metric">
                <span class="label">CPU Usage:</span>
                <span id="cpu">-</span>%
            </div>
            <div class="metric">
                <span class="label">Memory Usage:</span>
                <span id="memory">-</span> MB
            </div>
            <script>
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'updateMetrics') {
                        document.getElementById('cpu').textContent = message.metrics.cpu;
                        document.getElementById('memory').textContent = message.metrics.memory;
                    }
                });
                // Button event listeners
                if (document.getElementById('restartBtn')) {
                    document.getElementById('restartBtn').addEventListener('click', () => {
                        window.parent.postMessage({ type: 'restart' }, '*');
                        // For VS Code webview API
                        if (window.acquireVsCodeApi) {
                            acquireVsCodeApi().postMessage({ type: 'restart' });
                        }
                    });
                }
                if (document.getElementById('updateBtn')) {
                    document.getElementById('updateBtn').addEventListener('click', () => {
                        window.parent.postMessage({ type: 'update' }, '*');
                        if (window.acquireVsCodeApi) {
                            acquireVsCodeApi().postMessage({ type: 'update' });
                        }
                    });
                }
            </script>
        </body>
        </html>`;
    }
}
exports.PerformanceViewProvider = PerformanceViewProvider;
PerformanceViewProvider.viewType = 'vsblue.performanceView';
PerformanceViewProvider.bottomViewType = 'vsblue.performanceViewBottom';
//# sourceMappingURL=performanceViewProvider.js.map