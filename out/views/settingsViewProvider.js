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
exports.SettingsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class SettingsViewProvider {
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
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'restart':
                    vscode.commands.executeCommand('vsblue.restart');
                    break;
                case 'toggleHUD':
                    vscode.commands.executeCommand('vsblue.toggleMetricsHUD');
                    break;
                case 'toggleRedcode':
                    vscode.commands.executeCommand('vsblue.toggleRedcode');
                    break;
                case 'optimizeWorkspace':
                    vscode.commands.executeCommand('vsblue.optimizeWorkspace');
                    break;
                case 'optimizeMBP':
                    vscode.commands.executeCommand('vsblue.optimizeForMBP');
                    break;
            }
        });
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    margin: 5px 0;
                    border-radius: 2px;
                    cursor: pointer;
                    width: 100%;
                    text-align: left;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .section {
                    margin-bottom: 20px;
                }
                h2 {
                    margin-bottom: 10px;
                    font-size: 1.2em;
                }
            </style>
        </head>
        <body>
            <div class="section">
                <h2>Quick Actions</h2>
                <button class="button" onclick="sendMessage('restart')">Restart Extension</button>
                <button class="button" onclick="sendMessage('toggleHUD')">Toggle Performance HUD</button>
                <button class="button" onclick="sendMessage('toggleRedcode')">Toggle REDCODE Mode</button>
            </div>
            <div class="section">
                <h2>Optimization</h2>
                <button class="button" onclick="sendMessage('optimizeWorkspace')">Optimize Workspace</button>
                <button class="button" onclick="sendMessage('optimizeMBP')">Optimize for MacBook Pro</button>
            </div>
            <script>
                function sendMessage(type) {
                    vscode.postMessage({ type });
                }
            </script>
        </body>
        </html>`;
    }
}
exports.SettingsViewProvider = SettingsViewProvider;
SettingsViewProvider.viewType = 'vsblue-settings';
//# sourceMappingURL=settingsViewProvider.js.map