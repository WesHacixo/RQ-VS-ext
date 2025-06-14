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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
// Global state management
let canvasLayoutManager;
let workflowManager;
let metricsHUD;
let imfOverlayManager;
let iconGenerator;
let memoryManager;
let disposables = [];
let isActivated = false;
let logger;
let errorHandler;
let redcodeManager;
// Webview panel management
let performancePanel;
let memoryPanel;
let systemPanel;
let extensionPanel;
let editorPanel;
let gcPanel;
/**
 * Activates the VS Blue extension.
 *
 * @param context - The extension context
 */
function activate(context) {
    console.log('✅ RedQueen extension activated');
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('agentConsoleView', new AgentConsoleSidebarProvider(context)));
}
class AgentConsoleSidebarProvider {
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(view, _context, _token) {
        view.webview.options = { enableScripts: true };
        view.webview.html = this.getHtml();
    }
    getHtml() {
        return `
            <html>
                <body>
                    <h1 style="color: #c53dff">🧠 RedQueen Agent Console</h1>
                    <p>Sidebar mounted successfully!</p>
                </body>
            </html>
        `;
    }
}
/**
 * Deactivates the VS Blue extension.
 */
function deactivate() {
    // Cleanup will be handled by the dispose methods of our managers
}
/**
 * Shows performance details in a webview panel.
 *
 * @param context - The extension context
 * @param monitor - The performance monitor instance
 */
function showPerformanceDetails(context, monitor) {
    if (performancePanel) {
        performancePanel.reveal();
        return;
    }
    performancePanel = vscode.window.createWebviewPanel('vsbluePerformance', 'VS Blue Performance Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    performancePanel.webview.html = getPerformanceDetailsHtml(monitor);
    performancePanel.onDidDispose(() => {
        performancePanel = undefined;
    });
    // Update content periodically
    const updateInterval = setInterval(() => {
        if (performancePanel) {
            performancePanel.webview.html = getPerformanceDetailsHtml(monitor);
        }
        else {
            clearInterval(updateInterval);
        }
    }, 2000);
}
/**
 * Shows memory details in a webview panel.
 *
 * @param context - The extension context
 * @param monitor - The performance monitor instance
 */
function showMemoryDetails(context, monitor) {
    if (memoryPanel) {
        memoryPanel.reveal();
        return;
    }
    memoryPanel = vscode.window.createWebviewPanel('vsblueMemory', 'VS Blue Memory Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    memoryPanel.webview.html = getMemoryDetailsHtml(monitor);
    memoryPanel.onDidDispose(() => {
        memoryPanel = undefined;
    });
    // Update content periodically
    const updateInterval = setInterval(() => {
        if (memoryPanel) {
            memoryPanel.webview.html = getMemoryDetailsHtml(monitor);
        }
        else {
            clearInterval(updateInterval);
        }
    }, 2000);
}
/**
 * Shows system details in a webview panel.
 *
 * @param context - The extension context
 * @param monitor - The performance monitor instance
 */
function showSystemDetails(context, monitor) {
    if (systemPanel) {
        systemPanel.reveal();
        return;
    }
    systemPanel = vscode.window.createWebviewPanel('vsblueSystem', 'VS Blue System Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    systemPanel.webview.html = getSystemDetailsHtml(monitor);
    systemPanel.onDidDispose(() => {
        systemPanel = undefined;
    });
    // Update content periodically
    const updateInterval = setInterval(() => {
        if (systemPanel) {
            systemPanel.webview.html = getSystemDetailsHtml(monitor);
        }
        else {
            clearInterval(updateInterval);
        }
    }, 2000);
}
/**
 * Shows extension details in a webview panel.
 *
 * @param context - The extension context
 */
function showExtensionDetails(context) {
    if (extensionPanel) {
        extensionPanel.reveal();
        return;
    }
    extensionPanel = vscode.window.createWebviewPanel('vsblueExtension', 'VS Blue Extension Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    extensionPanel.webview.html = getExtensionDetailsHtml();
    extensionPanel.onDidDispose(() => {
        extensionPanel = undefined;
    });
}
/**
 * Shows editor details in a webview panel.
 *
 * @param context - The extension context
 */
function showEditorDetails(context) {
    if (editorPanel) {
        editorPanel.reveal();
        return;
    }
    editorPanel = vscode.window.createWebviewPanel('vsblueEditor', 'VS Blue Editor Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    editorPanel.webview.html = getEditorDetailsHtml();
    editorPanel.onDidDispose(() => {
        editorPanel = undefined;
    });
}
/**
 * Shows garbage collection details in a webview panel.
 *
 * @param context - The extension context
 * @param monitor - The performance monitor instance
 */
function showGCDetails(context, monitor) {
    if (gcPanel) {
        gcPanel.reveal();
        return;
    }
    gcPanel = vscode.window.createWebviewPanel('vsblueGC', 'VS Blue GC Details', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    gcPanel.webview.html = getGCDetailsHtml(monitor);
    gcPanel.onDidDispose(() => {
        gcPanel = undefined;
    });
    // Update content periodically
    const updateInterval = setInterval(() => {
        if (gcPanel) {
            gcPanel.webview.html = getGCDetailsHtml(monitor);
        }
        else {
            clearInterval(updateInterval);
        }
    }, 2000);
}
/**
 * Generates HTML for performance details panel.
 *
 * @param monitor - The performance monitor instance
 * @returns HTML string
 */
function getPerformanceDetailsHtml(monitor) {
    const metrics = monitor.getMetrics();
    console.log('Actual metrics shape:', metrics);
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue Performance Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .metric { margin: 10px 0; }
                .trend { margin-left: 10px; }
            </style>
        </head>
        <body>
            <h2>Performance Metrics</h2>
            <div class="metric">
                <strong>CPU Usage:</strong> ${metrics.cpu}%
                <span class="trend">${getTrendIndicator(metrics.cpuHistory)}</span>
            </div>
            <div class="metric">
                <strong>Memory Usage:</strong> ${formatBytes(metrics.memory)}
                <span class="trend">${getTrendIndicator(metrics.memoryHistory)}</span>
            </div>
            <div class="metric">
                <strong>Uptime:</strong> ${formatUptime(metrics.uptime)}
            </div>
            <div class="metric">
                <strong>Last GC:</strong> ${metrics.gcStats ? formatTimeAgo(metrics.gcStats.lastGCTime) : 'N/A'}
            </div>
        </body>
        </html>
    `;
}
/**
 * Generates HTML for memory details panel.
 *
 * @param monitor - The performance monitor instance
 * @returns HTML string
 */
function getMemoryDetailsHtml(monitor) {
    const metrics = monitor.getMetrics();
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue Memory Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .metric { margin: 10px 0; }
                .chart { margin: 20px 0; }
            </style>
        </head>
        <body>
            <h2>Memory Metrics</h2>
            <div class="metric">
                <strong>Used Memory:</strong> ${formatBytes(metrics.heapStats.used)}
            </div>
            <div class="metric">
                <strong>Total Heap:</strong> ${formatBytes(metrics.heapStats.total)}
            </div>
            <div class="metric">
                <strong>External Memory:</strong> ${formatBytes(metrics.heapStats.external)}
            </div>
            <div class="metric">
                <strong>Array Buffers:</strong> ${formatBytes(metrics.heapStats.arrayBuffers)}
            </div>
            <div class="metric">
                <strong>Fragmentation:</strong> ${metrics.heapStats.fragmentation.toFixed(2)}%
            </div>
            <div class="chart">
                <h3>Memory History</h3>
                ${getMemoryHistoryChart(metrics.memoryHistory)}
            </div>
        </body>
        </html>
    `;
}
/**
 * Generates HTML for system details panel.
 *
 * @param monitor - The performance monitor instance
 * @returns HTML string
 */
function getSystemDetailsHtml(monitor) {
    const metrics = monitor.getMetrics();
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue System Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .metric { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>System Metrics</h2>
            <div class="metric">
                <strong>CPU Cores:</strong> ${os.cpus().length}
            </div>
            <div class="metric">
                <strong>Load Average:</strong> ${metrics.loadAverage.join(', ')}
            </div>
            <div class="metric">
                <strong>Uptime:</strong> ${formatUptime(metrics.uptime)}
            </div>
            <div class="metric">
                <strong>Active Extensions:</strong> ${metrics.activeExtensions}
            </div>
            <div class="metric">
                <strong>Active Editors:</strong> ${metrics.activeEditors}
            </div>
            <div class="metric">
                <strong>Network In:</strong> ${formatBytes(metrics.networkStats.bytesIn)}
            </div>
            <div class="metric">
                <strong>Network Out:</strong> ${formatBytes(metrics.networkStats.bytesOut)}
            </div>
            <div class="metric">
                <strong>Active Connections:</strong> ${metrics.networkStats.connections}
            </div>
        </body>
        </html>
    `;
}
/**
 * Generates HTML for extension details panel.
 *
 * @returns HTML string
 */
function getExtensionDetailsHtml() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue Extension Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .extension { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>Extension Details</h2>
            <div class="extension">
                <strong>Name:</strong> VS Blue
            </div>
            <div class="extension">
                <strong>Version:</strong> 1.1.0
            </div>
            <div class="extension">
                <strong>Description:</strong> Performance optimization extension for VS Code
            </div>
        </body>
        </html>
    `;
}
/**
 * Generates HTML for editor details panel.
 *
 * @returns HTML string
 */
function getEditorDetailsHtml() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue Editor Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .metric { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>Editor Metrics</h2>
            <div class="metric">
                <strong>Active Editors:</strong> ${vscode.window.visibleTextEditors.length}
            </div>
            <div class="metric">
                <strong>Workspace Folders:</strong> ${vscode.workspace.workspaceFolders?.length || 0}
            </div>
        </body>
        </html>
    `;
}
/**
 * Generates HTML for garbage collection details panel.
 *
 * @param monitor - The performance monitor instance
 * @returns HTML string
 */
function getGCDetailsHtml(monitor) {
    const metrics = monitor.getMetrics();
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Blue GC Details</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .metric { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>Garbage Collection Metrics</h2>
            <div class="metric">
                <strong>Last GC:</strong> ${metrics.gcStats ? formatTimeAgo(metrics.gcStats.lastGCTime) : 'N/A'}
            </div>
            <div class="metric">
                <strong>GC Count:</strong> ${metrics.gcStats?.gcCount || 0}
            </div>
            <div class="metric">
                <strong>GC Duration:</strong> ${metrics.gcStats?.gcDuration ? `${metrics.gcStats.gcDuration.toFixed(2)} ms` : 'N/A'}
            </div>
            <div class="metric">
                <strong>Memory Before GC:</strong> ${metrics.gcStats ? formatBytes(metrics.gcStats.memoryBeforeGC) : 'N/A'}
            </div>
            <div class="metric">
                <strong>Memory After GC:</strong> ${metrics.gcStats ? formatBytes(metrics.gcStats.memoryAfterGC) : 'N/A'}
            </div>
            <div class="metric">
                <strong>Memory Freed:</strong> ${metrics.gcStats ? formatBytes(metrics.gcStats.memoryBeforeGC - metrics.gcStats.memoryAfterGC) : 'N/A'}
            </div>
        </body>
        </html>
    `;
}
/**
 * Formats bytes to a human-readable string.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string
 */
function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}
/**
 * Formats uptime in seconds to a human-readable string.
 *
 * @param seconds - Number of seconds
 * @returns Formatted string
 */
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}
/**
 * Formats a timestamp to a relative time string.
 *
 * @param ms - Timestamp in milliseconds
 * @returns Formatted string
 */
function formatTimeAgo(ms) {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) {
        return `${seconds}s ago`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
/**
 * Generates a trend indicator based on a history array.
 *
 * @param history - Array of historical values
 * @returns Trend indicator string
 */
function getTrendIndicator(history) {
    if (history.length < 2) {
        return '→';
    }
    const last = history[history.length - 1];
    const previous = history[history.length - 2];
    if (last > previous) {
        return '↑';
    }
    else if (last < previous) {
        return '↓';
    }
    return '→';
}
/**
 * Generates an ASCII chart for memory history.
 *
 * @param history - Array of memory usage values
 * @returns ASCII chart string
 */
function getMemoryHistoryChart(history) {
    if (history.length === 0) {
        return 'No data available';
    }
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min;
    const height = 10;
    const width = Math.min(history.length, 50);
    let chart = '';
    for (let i = 0; i < height; i++) {
        const threshold = max - (range * i / height);
        let line = '';
        for (let j = 0; j < width; j++) {
            const value = history[history.length - width + j];
            line += value >= threshold ? '█' : ' ';
        }
        chart += line + '\n';
    }
    return `<pre>${chart}</pre>`;
}
//# sourceMappingURL=extension.js.map