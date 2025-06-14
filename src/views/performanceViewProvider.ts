import * as vscode from 'vscode';
import { getMetrics, watch, PerformanceMetrics } from '../performance/monitor';

export class PerformanceViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsblue.performanceView';
    public static readonly bottomViewType = 'vsblue.performanceViewBottom';

    private _view?: vscode.WebviewView;
    private _updateInterval?: NodeJS.Timeout | (() => void);

    constructor(
        private readonly _extensionUri: vscode.Uri
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

        webviewView.webview.html = this._getHtmlForWebview();

        // Listen for button messages
        webviewView.webview.onDidReceiveMessage(async (data) => {
            if (data.type === 'restart') {
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else if (data.type === 'update') {
                vscode.window.showInformationMessage('VS Blue: Update feature coming soon!');
            }
        });

        this._startUpdates();

        webviewView.onDidDispose(() => {
            this._stopUpdates();
        });
    }

    private _startUpdates() {
        this._stopUpdates();
        
        // Initial metrics
        const initialMetrics = getMetrics();
        this._updateView(initialMetrics);
        
        // Set up real-time updates
        this._updateInterval = watch((metrics: PerformanceMetrics) => {
            if (this._view) {
                this._updateView(metrics);
            }
        }, 1000);
    }
    
    private _updateView(metrics: PerformanceMetrics) {
        if (!this._view) {return;}
        
        // Format metrics for the view
        const formattedMetrics = {
            cpu: (metrics.cpuUsage * 100).toFixed(1),
            memory: metrics.memoryUsageMB.toFixed(1),
            totalMemory: metrics.memoryTotalMB.toFixed(1),
            loadAverage: metrics.loadAverage.map(load => load.toFixed(2)).join(', '),
            uptime: this._formatUptime(metrics.uptimeSeconds)
        };
        
        this._view.webview.postMessage({
            type: 'updateMetrics',
            metrics: formattedMetrics
        });
    }
    
    private _formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        if (days > 0) { parts.push(`${days}d`); }
        if (hours > 0) { parts.push(`${hours}h`); }
        if (minutes > 0) { parts.push(`${minutes}m`); }
        if (secs > 0 || parts.length === 0) { parts.push(`${secs}s`); }
        
        return parts.join(' ');
    }

    private _stopUpdates() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = undefined;
        }
    }

    private _getHtmlForWebview() {
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
                    <div class="label">CPU</div>
                    <div id="cpu">0%</div>
                </div>
                <div class="metric">
                    <div class="label">Memory</div>
                    <div id="memory">0 MB / 0 MB</div>
                </div>
                <div class="metric">
                    <div class="label">Load Avg</div>
                    <div id="load">0.00, 0.00, 0.00</div>
                </div>
                <div class="metric">
                    <div class="label">Uptime</div>
                    <div id="uptime">0s</div>
                </div>
            <script>
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'updateMetrics') {
                        document.getElementById('cpu')!.textContent = message.metrics.cpu + '%';
                document.getElementById('memory')!.textContent = 
                    message.metrics.memory + ' MB / ' + message.metrics.totalMemory + ' MB';
                document.getElementById('load')!.textContent = message.metrics.loadAverage;
                document.getElementById('uptime')!.textContent = message.metrics.uptime;                  }
                });
                // Button event listeners
                const restartBtn = document.getElementById('restartBtn');
                if (restartBtn) {
                    restartBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'restart' });
                    });
                }
                const updateBtn = document.getElementById('updateBtn');
                if (updateBtn) {
                    updateBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'update' });
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
