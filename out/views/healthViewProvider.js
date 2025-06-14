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
exports.HealthViewProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class HealthViewProvider {
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
        // Start updating health data
        this._startUpdates();
        // Handle visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._startUpdates();
            }
            else {
                this._stopUpdates();
            }
        });
        // Handle dispose
        webviewView.onDidDispose(() => {
            this._stopUpdates();
        });
    }
    async _getWorkspaceHealth() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return {
                score: 0,
                issues: ['No workspace folder open']
            };
        }
        const issues = [];
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
    async _findLargeFiles(rootPath) {
        const largeFiles = [];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        for (const file of files) {
            try {
                const stats = await fs.promises.stat(file.fsPath);
                if (stats.size > maxSize) {
                    largeFiles.push(path.relative(rootPath, file.fsPath));
                }
            }
            catch (error) {
                console.error(`Error checking file size: ${file.fsPath}`, error);
            }
        }
        return largeFiles;
    }
    async _getNodeModulesSize(rootPath) {
        const nodeModulesPath = path.join(rootPath, 'node_modules');
        try {
            const stats = await fs.promises.stat(nodeModulesPath);
            return stats.size;
        }
        catch {
            return 0;
        }
    }
    async _hasGitRepository(rootPath) {
        const gitPath = path.join(rootPath, '.git');
        try {
            const stats = await fs.promises.stat(gitPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    async _hasGitignore(rootPath) {
        const gitignorePath = path.join(rootPath, '.gitignore');
        try {
            const stats = await fs.promises.stat(gitignorePath);
            return stats.isFile();
        }
        catch {
            return false;
        }
    }
    async _checkMemoryIntensiveExtensions() {
        const memoryIntensiveExtensions = [
            'ms-python.python',
            'ms-vscode.vscode-typescript-next',
            'ms-azuretools.vscode-docker',
            'ms-vscode.cpptools',
            'ms-vscode.powershell'
        ];
        const installedExtensions = vscode.extensions.all;
        return installedExtensions
            .filter((ext) => memoryIntensiveExtensions.includes(ext.id))
            .map((ext) => ext.packageJSON.displayName || ext.id);
    }
    async _getWorkspaceFileCount(rootPath) {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        return files.length;
    }
    _getRecommendations(issues) {
        const recommendations = [];
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
    _startUpdates() {
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
    _stopUpdates() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = undefined;
        }
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
exports.HealthViewProvider = HealthViewProvider;
HealthViewProvider.viewType = 'vsblue-health';
//# sourceMappingURL=healthViewProvider.js.map