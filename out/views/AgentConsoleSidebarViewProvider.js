"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentConsoleSidebarViewProvider = void 0;
class AgentConsoleSidebarViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
        const nonce = getNonce();
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <title>Agent Console</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          // In a real implementation, you would bundle and inject your React app here.
          // For now, this is a stub.
          document.getElementById('root').innerHTML = '<div style="padding: 16px; background: #222; color: #fff;">Agent Console Sidebar (stub)</div>';
        </script>
      </body>
      </html>
    `;
    }
}
exports.AgentConsoleSidebarViewProvider = AgentConsoleSidebarViewProvider;
AgentConsoleSidebarViewProvider.viewType = 'agentConsoleView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=AgentConsoleSidebarViewProvider.js.map