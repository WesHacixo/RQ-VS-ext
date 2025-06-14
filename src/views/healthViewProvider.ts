import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class HealthViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsblue-health';

    private _view?: vscode.WebviewView;
    private _updateInterval?: NodeJS.Timeout;

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

        // Start updating health data
        this._startUpdates();

        // Handle visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._startUpdates();
            } else {
                this._stopUpdates();
            }
        });

        // Handle dispose
        webviewView.onDidDispose(() => {
            this._stopUpdates();
        });
    }

    private async _getWorkspaceHealth() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return {
                score: 0,
                issues: ['No workspace folder open']
            };
        }

        const issues: string[] = [];
        let score = 100;

        // Check for large files that might impact memory
        const largeFiles = await this._findLargeFiles(workspaceFolders[0].uri.fsPath);
        if (largeFiles.length > 0) {
            issues.push(`Found ${largeFiles.length} large files (>5MB) that may impact memory`);
            score -= 10;
        }

        // Check for node_modules size
        const nodeModulesSize = await this._getNodeModulesSize(workspaceFolders[0].uri.fsPath);
        if (nodeModulesSize > 500 * 1024 * 1024) { // 500MB
            issues.push('Large node_modules directory detected (memory impact)');
            score -= 15;
        }

        // Check for memory-intensive extensions
        const memoryIntensiveExtensions = await this._checkMemoryIntensiveExtensions();
        if (memoryIntensiveExtensions.length > 0) {
            issues.push(`Memory-intensive extensions detected: ${memoryIntensiveExtensions.join(', ')}`);
            score -= 10;
        }

        // Check for workspace file count
        const fileCount = await this._getWorkspaceFileCount(workspaceFolders[0].uri.fsPath);
        if (fileCount > 10000) {
            issues.push('Large number of files in workspace (may impact memory)');
            score -= 5;
        }

        // Check for git repository
        const hasGit = await this._hasGitRepository(workspaceFolders[0].uri.fsPath);
        if (!hasGit) {
            issues.push('No git repository found (affects file watching)');
            score -= 5;
        }

        // Check for .gitignore
        const hasGitignore = await this._hasGitignore(workspaceFolders[0].uri.fsPath);
        if (!hasGitignore) {
            issues.push('No .gitignore file found (may impact file watching)');
            score -= 5;
        }

        return {
            score: Math.max(0, score),
            issues,
            recommendations: this._getRecommendations(issues)
        };
    }

    private async _findLargeFiles(rootPath: string): Promise<string[]> {
        const largeFiles: string[] = [];
        const maxSize = 5 * 1024 * 1024; // 5MB

        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        for (const file of files) {
            try {
                const stats = await fs.promises.stat(file.fsPath);
                if (stats.size > maxSize) {
                    largeFiles.push(path.relative(rootPath, file.fsPath));
                }
            } catch (error) {
                console.error(`Error checking file size: ${file.fsPath}`, error);
            }
        }

        return largeFiles;
    }

    private async _getNodeModulesSize(rootPath: string): Promise<number> {
        const nodeModulesPath = path.join(rootPath, 'node_modules');
        try {
            const stats = await fs.promises.stat(nodeModulesPath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    private async _hasGitRepository(rootPath: string): Promise<boolean> {
        const gitPath = path.join(rootPath, '.git');
        try {
            const stats = await fs.promises.stat(gitPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    private async _hasGitignore(rootPath: string): Promise<boolean> {
        const gitignorePath = path.join(rootPath, '.gitignore');
        try {
            const stats = await fs.promises.stat(gitignorePath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    private async _checkMemoryIntensiveExtensions(): Promise<string[]> {
        const memoryIntensiveExtensions = [
            'ms-python.python',
            'ms-vscode.vscode-typescript-next',
            'ms-azuretools.vscode-docker',
            'ms-vscode.cpptools',
            'ms-vscode.powershell'
        ];

        const installedExtensions = vscode.extensions.all;
        return installedExtensions
            .filter((ext: any) => memoryIntensiveExtensions.includes(ext.id))
            .map((ext: any) => ext.packageJSON.displayName || ext.id);
    }

    private async _getWorkspaceFileCount(rootPath: string): Promise<number> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        return files.length;
    }

    private _getRecommendations(issues: string[]): string[] {
        const recommendations: string[] = [];

        if (issues.includes('No git repository found')) {
            recommendations.push('Initialize a git repository: `git init`');
        }
        if (issues.includes('No .gitignore file found')) {
            recommendations.push('Create a .gitignore file for your project type');
        }
        if (issues.includes('Large node_modules directory detected')) {
            recommendations.push('Consider using pnpm or yarn for better dependency management');
        }
        if (issues.some(issue => issue.includes('large files'))) {
            recommendations.push('Review large files and consider adding them to .gitignore');
        }

        return recommendations;
    }

    private _startUpdates() {
        this._stopUpdates();
        this._updateInterval = setInterval(async () => {
            if (this._view) {
                const health = await this._getWorkspaceHealth();
                this._view.webview.postMessage({
                    type: 'updateHealth',
                    health
                });
            }
        }, 5000); // Update every 5 seconds
    }

    private _stopUpdates() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = undefined;
        }
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
                    background: transparent;
                }
                .health-score {
                    font-size: 2em;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0;
                    background: rgba(var(--vscode-editor-background-rgb), 0.7);
                    backdrop-filter: blur(10px);
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .score-good {
                    color: var(--vscode-testing-iconPassed);
                }
                .score-warning {
                    color: var(--vscode-testing-iconQueued);
                }
                .score-bad {
                    color: var(--vscode-testing-iconFailed);
                }
                .section {
                    margin-bottom: 20px;
                    background: rgba(var(--vscode-editor-background-rgb), 0.7);
                    backdrop-filter: blur(10px);
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                .section:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                h2 {
                    margin-bottom: 15px;
                    font-size: 1.2em;
                    color: var(--vscode-activityBarBadge-background);
                }
                .issue-list, .recommendation-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .issue-list li, .recommendation-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                }
                .issue-list li:last-child, .recommendation-list li:last-child {
                    border-bottom: none;
                }
                .status-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 15px;
                    font-size: 0.9em;
                    display: none;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                }
                .status-bar.visible {
                    display: block;
                    animation: slideDown 0.3s ease;
                }
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
            </style>
        </head>
        <body>
            <div id="statusBar" class="status-bar"></div>
            <div class="health-score" id="score">Loading...</div>
            <div class="section">
                <h2>Memory Impact Issues</h2>
                <ul class="issue-list" id="issues"></ul>
            </div>
            <div class="section">
                <h2>Optimization Recommendations</h2>
                <ul class="recommendation-list" id="recommendations"></ul>
            </div>
            <script>
                function showStatus(message, duration = 3000) {
                    const statusBar = document.getElementById('statusBar');
                    statusBar.textContent = message;
                    statusBar.classList.add('visible');
                    setTimeout(() => {
                        statusBar.classList.remove('visible');
                    }, duration);
                }

                function updateHealth(health) {
                    // Update score
                    const scoreElement = document.getElementById('score');
                    scoreElement.textContent = \`Memory Health Score: \${health.score}\`;
                    scoreElement.className = 'health-score ' +
                        (health.score >= 80 ? 'score-good' :
                         health.score >= 50 ? 'score-warning' : 'score-bad');

                    // Update issues
                    const issuesList = document.getElementById('issues');
                    issuesList.innerHTML = health.issues.length ?
                        health.issues.map(issue => \`<li>\${issue}</li>\`).join('') :
                        '<li>No memory issues found</li>';

                    // Update recommendations
                    const recommendationsList = document.getElementById('recommendations');
                    recommendationsList.innerHTML = health.recommendations.length ?
                        health.recommendations.map(rec => \`<li>\${rec}</li>\`).join('') :
                        '<li>No optimizations needed</li>';

                    // Show status for significant issues
                    if (health.score < 50) {
                        showStatus('Critical memory issues detected. Check recommendations.');
                    } else if (health.score < 80) {
                        showStatus('Some memory optimizations available. Check recommendations.');
                    }
                }

                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'updateHealth':
                            updateHealth(message.health);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
