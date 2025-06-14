import * as vscode from 'vscode';

export class SettingsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsblue-settings';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
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

    private _getHtmlForWebview(webview: vscode.Webview) {
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
