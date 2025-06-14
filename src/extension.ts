import * as vscode from 'vscode';
import { getMetrics, watch, PerformanceMetrics } from './performance/monitor';
import * as os from 'os';
import { IconGenerator } from './ui/iconGenerator';
import { IMFOverlayManager } from './ui/imfOverlays';
import { MetricsHUD } from './ui/metricsHUD';
import { ErrorHandler } from './utils/errorHandler';
import { Logger } from './utils/logger';
import { WorkflowManager } from './workflow/manager';
import { RedcodeManager } from './workflow/redcodeManager';

// Global state management
let workflowManager: WorkflowManager;
let metricsHUD: MetricsHUD | null = null;
let imfOverlayManager: IMFOverlayManager;
let iconGenerator: IconGenerator;
let logger: Logger;
let errorHandler: ErrorHandler;
let redcodeManager: RedcodeManager;

// Webview panel management
let performancePanel: vscode.WebviewPanel | undefined;
let memoryPanel: vscode.WebviewPanel | undefined;
let systemPanel: vscode.WebviewPanel | undefined;
let extensionPanel: vscode.WebviewPanel | undefined;
let editorPanel: vscode.WebviewPanel | undefined;
let gcPanel: vscode.WebviewPanel | undefined;

// Metrics state
let currentMetrics: PerformanceMetrics | null = null;

// Track extension context
let extensionContext: vscode.ExtensionContext | undefined;

// Track monitoring state
let isMonitoring = false;
let stopWatching: (() => void) | null = null;

// Track active panels
const activePanels = new Set<vscode.WebviewPanel>();

// Status bar items
interface StatusBarItems {
    cpu?: vscode.StatusBarItem;
    memory?: vscode.StatusBarItem;
    load?: vscode.StatusBarItem;
}

const statusBarItems: StatusBarItems = {};

/**
 * Activates the VS Blue extension.
 *
 * @param context - The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('✅ RedQueen extension activated');

    // Register webview providers
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'agentConsoleView',
            new AgentConsoleSidebarProvider(context)
        )
    );

    // Start performance monitoring
    startPerformanceMonitoring(context);

    // Store context for later use
    extensionContext = context;
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vsblue.showPerformanceDetails', () => {
            if (extensionContext) {
                showPerformanceDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.showMemoryDetails', () => {
            if (extensionContext) {
                showMemoryDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.showSystemDetails', () => {
            if (extensionContext) {
                showSystemDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.showExtensionDetails', () => {
            if (extensionContext) {
                showExtensionDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.showEditorDetails', () => {
            if (extensionContext) {
                showEditorDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.showGCDetails', () => {
            if (extensionContext) {
                showGCDetails(extensionContext);
            }
        }),
        vscode.commands.registerCommand('vsblue.toggleMonitoring', () => {
            toggleMonitoring();
        })
    );

    // Start monitoring by default
    if (extensionContext) {
        startMonitoring();
    }

    // Update panels when the active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            if (currentMetrics) {
                updateAllPanels(currentMetrics);
            }
        })
    );

    // Clean up when the extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            stopMonitoring();
        }
    });

    // Initial update
    currentMetrics = getMetrics();
    updateStatusBar(currentMetrics);
}

/**
 * Starts performance monitoring with the new monitor.ts implementation
 */
function startPerformanceMonitoring(context: vscode.ExtensionContext): void {
    // Initialize MetricsHUD
    metricsHUD = new MetricsHUD(context);
    context.subscriptions.push(metricsHUD);

    // Initial metrics collection
    const initialMetrics = getMetrics();
    console.log('Initial performance metrics:', initialMetrics);

    // Declare stopWatching at the function level
    let stopWatching: (() => void) | undefined;

    // Set up real-time monitoring
    const watcher = watch((metrics) => {
        // Update any components that depend on real-time metrics
        if (metricsHUD) {
            metricsHUD.updateMetrics(metrics);
        }
        
        // Log significant events
        if (metrics.cpuUsage > 0.9) {
            console.warn(`High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`);
        }
    }, 5000); // Update every 5 seconds

    // Store the stop function
    stopWatching = watcher;

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            if (stopWatching) {
                stopWatching();
                stopWatching = undefined;
            }
        }
    });
}

class AgentConsoleSidebarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(
        view: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        view.webview.options = { enableScripts: true };
        view.webview.html = this.getHtml();
    }

    private getHtml(): string {
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
export function deactivate(): void {
    // Clean up performance monitoring
    if (stopWatching) {
        stopWatching();
        stopWatching = null;
    }
    
    // Clean up all panels
    try {
        for (const panel of activePanels) {
            try {
                if (panel) {
                    panel.dispose();
                }
            } catch (error) {
                console.error('Error disposing panel:', error);
            }
        }
        activePanels.clear();
    } catch (error) {
        console.error('Error cleaning up panels:', error);
    }
    
    // Clean up other resources
    try {
        if (extensionContext?.subscriptions) {
            const subscriptions = [...extensionContext.subscriptions];
            for (const disposable of subscriptions) {
                try {
                    disposable.dispose();
                } catch (error) {
                    console.error('Error disposing resource:', error);
                }
            }
            extensionContext.subscriptions.length = 0;
        }
    } catch (error) {
        console.error('Error cleaning up resources:', error);
    }
    
    // Reset monitoring state
    isMonitoring = false;
}

/**
 * Shows performance details in a webview panel.
 *
 * @param context - The extension context
 */
function showPerformanceDetails(context: vscode.ExtensionContext): void {
    if (performancePanel) {
        performancePanel.reveal(performancePanel.viewColumn);
        return;
    }

    performancePanel = vscode.window.createWebviewPanel(
        'performanceDetails',
        'Performance Details',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track the panel
    activePanels.add(performancePanel);

    const updateWebview = () => {
        if (performancePanel && currentMetrics) {
            performancePanel.webview.html = getPerformanceDetailsHtml(currentMetrics);
        }
    };

    // Initial update
    updateWebview();

    // Update when the panel is visible
    const disposable = performancePanel.onDidChangeViewState(
        () => {
            if (performancePanel?.visible) {
                updateWebview();
            }
        },
        null,
        context.subscriptions
    );
    
    // Add to context subscriptions
    context.subscriptions.push(disposable);

    // Clean up when the panel is closed
    performancePanel.onDidDispose(
        () => {
            if (performancePanel) {
                activePanels.delete(performancePanel);
                performancePanel = undefined;
            }
        },
        null,
        context.subscriptions
    );
}

/**
 * Shows memory details in a webview panel.
 *
 * @param context - The extension context
 */
function showMemoryDetails(context: vscode.ExtensionContext): void {
    if (memoryPanel) {
        memoryPanel.reveal(undefined, true);
        return;
    }

    memoryPanel = vscode.window.createWebviewPanel(
        'memoryDetails',
        'Memory Details',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    const updateWebview = () => {
        if (memoryPanel && currentMetrics) {
            memoryPanel.webview.html = getMemoryDetailsHtml(currentMetrics);
        }
    };

    // Initial update
    updateWebview();

    // Update on metrics change
    const disposable = vscode.workspace.onDidChangeTextDocument(() => {
        if (currentMetrics) {
            updateWebview();
        }
    });

    memoryPanel.onDidDispose(
        () => {
            disposable.dispose();
            memoryPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

/**
 * Shows system details in a webview panel.
 *
 * @param context - The extension context
 */
function showSystemDetails(context: vscode.ExtensionContext): void {
    if (systemPanel) {
        systemPanel.reveal(undefined, true);
        return;
    }

    systemPanel = vscode.window.createWebviewPanel(
        'systemDetails',
        'System Details',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    const updateWebview = () => {
        if (systemPanel && currentMetrics) {
            systemPanel.webview.html = getSystemDetailsHtml(currentMetrics);
        }
    };

    // Initial update
    updateWebview();

    // Update on metrics change
    const disposable = vscode.workspace.onDidChangeTextDocument(() => {
        if (currentMetrics) {
            updateWebview();
        }
    });

    systemPanel.onDidDispose(
        () => {
            disposable.dispose();
            systemPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

/**
 * Shows extension details in a webview panel.
 *
 * @param context - The extension context
 */
function showExtensionDetails(context: vscode.ExtensionContext): void {
    if (extensionPanel) {
        extensionPanel.reveal();
        return;
    }

    extensionPanel = vscode.window.createWebviewPanel(
        'vsblueExtension',
        'VS Blue Extension Details',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    if (currentMetrics) {
        extensionPanel.webview.html = getExtensionDetailsHtml(currentMetrics);
    } else {
        extensionPanel.webview.html = '<p>No metrics available</p>';
    }
    
    extensionPanel.onDidDispose(() => {
        extensionPanel = undefined;
    });
}

/**
 * Shows editor details in a webview panel.
 *
 * @param context - The extension context
 */
function showEditorDetails(context: vscode.ExtensionContext): void {
    if (editorPanel) {
        editorPanel.reveal();
        return;
    }

    editorPanel = vscode.window.createWebviewPanel(
        'vsblueEditor',
        'VS Blue Editor Details',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    editorPanel.webview.html = currentMetrics ? getEditorDetailsHtml(currentMetrics) : '<div>No metrics available</div>';
    editorPanel.onDidDispose(() => {
        editorPanel = undefined;
    });
}

/**
 * Shows garbage collection details in a webview panel.
 *
 * @param context - The extension context
 */
function showGCDetails(context: vscode.ExtensionContext): void {
    if (gcPanel) {
        gcPanel.reveal(undefined, true);
        return;
    }

    gcPanel = vscode.window.createWebviewPanel(
        'gcDetails',
        'Garbage Collection Details',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    const updateWebview = () => {
        if (gcPanel && currentMetrics) {
            gcPanel.webview.html = getGCDetailsHtml(currentMetrics);
        }
    };

    // Initial update
    updateWebview();
    
    // Update on metrics change
    const disposable = vscode.workspace.onDidChangeTextDocument(() => {
        if (currentMetrics) {
            updateWebview();
        }
    });

    gcPanel.onDidDispose(
        () => {
            disposable.dispose();
            gcPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

/**
 * Generates HTML for performance details panel.
 *
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getPerformanceDetailsHtml(metrics: PerformanceMetrics): string {
    if (!metrics) {
        return '<div>No metrics available</div>';
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Performance Details</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .metric { 
                    margin-bottom: 15px;
                    padding: 12px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-label { 
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 6px;
                }
                .metric-value { 
                    color: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-editor-font-family);
                }
                h2 { 
                    color: var(--vscode-foreground);
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
                .chart-container { 
                    margin: 20px 0; 
                    height: 200px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    padding: 10px;
                }
            </style>
        </head>
        <body>
            <h2>Performance Metrics</h2>
            <div class="metric">
                <div class="metric-label">CPU Usage</div>
                <div class="metric-value">${(metrics.cpuUsage * 100).toFixed(1)}%</div>
                <div class="chart-container" id="cpuChart"></div>
            </div>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">
                    ${metrics.memoryUsageMB.toFixed(1)} MB / ${metrics.memoryTotalMB.toFixed(1)} MB
                    (${((metrics.memoryUsageMB / metrics.memoryTotalMB) * 100).toFixed(1)}%)
                </div>
                <div class="chart-container" id="memoryChart"></div>
            </div>
            <div class="metric">
                <div class="metric-label">System Load Average</div>
                <div class="metric-value">${metrics.loadAverage.map((l, i) => 
                    `${i === 0 ? '1 min' : i === 1 ? '5 min' : '15 min'}: ${l.toFixed(2)}`
                ).join(' | ')}</div>
            </div>
            <div class="metric">
                <div class="metric-label">System Uptime</div>
                <div class="metric-value">${formatUptime(metrics.uptimeSeconds)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Platform</div>
                <div class="metric-value">${metrics.platform} (${os.arch()})</div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates HTML for system details panel.
 *
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getSystemDetailsHtml(metrics: PerformanceMetrics): string {
    if (!metrics) {
        return '<div>No metrics available</div>';
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>System Details</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                .metric { margin-bottom: 15px; }
                .metric-label { font-weight: bold; display: inline-block; width: 150px; }
                .metric-value { margin-left: 10px; }
            </style>
        </head>
        <body>
            <h2>System Metrics</h2>
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
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getGCDetailsHtml(metrics: PerformanceMetrics): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Garbage Collection Details</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .metric { 
                    margin-bottom: 15px;
                    padding: 12px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-label { 
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 6px;
                }
                .metric-value { 
                    color: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-editor-font-family);
                }
                h2 { 
                    color: var(--vscode-foreground);
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
                .memory-usage {
                    margin-top: 10px;
                    height: 24px;
                    background: var(--vscode-progressBar-background);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .memory-used {
                    height: 100%;
                    background: var(--vscode-progressBar-background);
                    background: linear-gradient(90deg, 
                        var(--vscode-editor-selectionBackground) 0%, 
                        var(--vscode-editor-selectionBackground) ${metrics.memoryUsageMB / metrics.memoryTotalMB * 100}%, 
                        transparent ${metrics.memoryUsageMB / metrics.memoryTotalMB * 100}%);
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <h2>Garbage Collection Metrics</h2>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">
                    ${metrics.memoryUsageMB.toFixed(1)} MB / ${metrics.memoryTotalMB.toFixed(1)} MB
                    (${((metrics.memoryUsageMB / metrics.memoryTotalMB) * 100).toFixed(1)}%)
                </div>
                <div class="memory-usage">
                    <div class="memory-used"></div>
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">GC Information</div>
                <div class="metric-value">
                    Garbage collection metrics are not available in the current implementation.
                    This feature may be added in a future update.
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates HTML for extension details panel.
 *
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getExtensionDetailsHtml(metrics: PerformanceMetrics): string {
    if (!metrics) {
        return '<div>No metrics available</div>';
    }

    const extensions = vscode.extensions.all;
    const activeExtensions = extensions.filter(ext => ext.isActive);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Extension Details</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .metric { 
                    margin-bottom: 15px;
                    padding: 12px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-label { 
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 6px;
                }
                .metric-value { 
                    color: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-editor-font-family);
                }
                h2 { 
                    color: var(--vscode-foreground);
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
                .extensions-list {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-top: 10px;
                }
                .extension-item {
                    padding: 8px 0;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
                .extension-name {
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                .extension-id {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    word-break: break-all;
                }
            </style>
        </head>
        <body>
            <h2>Extension Details</h2>
            <div class="metric">
                <div class="metric-label">Total Extensions</div>
                <div class="metric-value">${extensions.length} (${activeExtensions.length} active)</div>
            </div>
            <div class="metric">
                <div class="metric-label">Extensions List</div>
                <div class="extensions-list">
                    ${extensions.map(ext => `
                        <div class="extension-item">
                            <div class="extension-name">${ext.packageJSON.displayName || ext.id}</div>
                            <div class="extension-id">${ext.id} ${ext.isActive ? '🟢' : '⚪'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates HTML for editor details panel.
 *
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getEditorDetailsHtml(metrics: PerformanceMetrics): string {
    if (!metrics) {
        return '<div>No metrics available</div>';
    }

    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const language = document?.languageId || 'plaintext';
    const lineCount = document?.lineCount || 0;
    const wordCount = document?.getText().split(/\s+/).filter(word => word.length > 0).length || 0;
    const selection = editor?.selection;
    const cursorPosition = selection ? 
        `Line ${selection.start.line + 1}, Column ${selection.start.character + 1}` : 'No selection';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Editor Details</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .metric { 
                    margin-bottom: 15px;
                    padding: 12px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-label { 
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 6px;
                }
                .metric-value { 
                    color: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-editor-font-family);
                }
                h2 { 
                    color: var(--vscode-foreground);
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
            </style>
        </head>
        <body>
            <h2>Editor Details</h2>
            <div class="metric">
                <div class="metric-label">Current File</div>
                <div class="metric-value">${document?.fileName || 'No active document'}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Language</div>
                <div class="metric-value">${language}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Document Stats</div>
                <div class="metric-value">
                    ${lineCount} lines • ${wordCount} words • ${formatBytes(document?.getText().length || 0)}
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">Cursor Position</div>
                <div class="metric-value">${cursorPosition}</div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates HTML for memory details panel.
 *
 * @param metrics - The performance metrics
 * @returns HTML string
 */
function getMemoryDetailsHtml(metrics: PerformanceMetrics): string {
    if (!metrics) {
        return '<div>No metrics available</div>';
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Memory Details</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .metric { 
                    margin-bottom: 15px;
                    padding: 12px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-label { 
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 6px;
                }
                .metric-value { 
                    color: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-editor-font-family);
                }
                h2 { 
                    color: var(--vscode-foreground);
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
                }
                .memory-usage {
                    margin-top: 10px;
                    height: 24px;
                    background: var(--vscode-progressBar-background);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .memory-used {
                    height: 100%;
                    background: var(--vscode-progressBar-background);
                    background: linear-gradient(90deg, 
                        var(--vscode-editor-selectionBackground) 0%, 
                        var(--vscode-editor-selectionBackground) ${metrics.memoryUsageMB / metrics.memoryTotalMB * 100}%, 
                        transparent ${metrics.memoryUsageMB / metrics.memoryTotalMB * 100}%);
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <h2>Memory Metrics</h2>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">
                    ${metrics.memoryUsageMB.toFixed(1)} MB / ${metrics.memoryTotalMB.toFixed(1)} MB
                    (${((metrics.memoryUsageMB / metrics.memoryTotalMB) * 100).toFixed(1)}%)
                </div>
                <div class="memory-usage">
                    <div class="memory-used"></div>
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">System Load</div>
                <div class="metric-value">${metrics.loadAverage[0].toFixed(2)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">
                    ${metrics.memoryUsageMB.toFixed(1)} MB / ${metrics.memoryTotalMB.toFixed(1)} MB
                    (${((metrics.memoryUsageMB / metrics.memoryTotalMB) * 100).toFixed(1)}%)
                </div>
                <div class="memory-usage">
                    <div class="memory-used" style="width: ${(metrics.memoryUsageMB / metrics.memoryTotalMB) * 100}%"></div>
                </div>
            </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates HTML for memory history chart.
 *
 * @param history - The memory usage history
 * @returns HTML string representing the memory history chart
 */
function getMemoryHistoryChart(history: number[]): string {
    if (history.length === 0) {
        return '<pre>No data available</pre>';
    }
    
    const max = Math.max(...history);
    if (max === 0) {
        return '<pre>No data available</pre>';
    }
    
    const scale = 10;
    const scaled = history.map(h => Math.round((h / max) * scale));
    
    let chart = '';
    for (let i = scale; i >= 0; i--) {
        chart += scaled.map(h => h >= i ? '█' : ' ').join('') + '\n';
    }
    
    return `<pre>${chart}</pre>`;
}

// Update the disposables array to be mutable
let disposables: vscode.Disposable[] = [];

/**
 * Formats bytes to a human-readable string.
 * @param bytes - The number of bytes
 * @returns Formatted string with appropriate unit (B, KB, MB, GB)
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats uptime in seconds to a human-readable string.
 * @param seconds - Uptime in seconds
 * @returns Formatted string (e.g., "1d 2h 3m 4s")
 */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) {parts.push(`${days}d`);}
    if (hours > 0) {parts.push(`${hours}h`);}
    if (minutes > 0) {parts.push(`${minutes}m`);}
    if (secs > 0 || parts.length === 0) {parts.push(`${secs}s`);}
    
    return parts.join(' ');
}

/**
 * Updates the status bar with current metrics
 */
function updateStatusBar(metrics: PerformanceMetrics): void {
    // Update CPU status bar item
    const cpuText = `CPU: ${(metrics.cpuUsage * 100).toFixed(1)}%`;
    
    // Update memory status bar item
    const memoryText = `Mem: ${metrics.memoryUsageMB.toFixed(1)}/${metrics.memoryTotalMB.toFixed(1)} MB`;
    
    // Update load status bar item
    const loadText = `Load: ${metrics.loadAverage[0].toFixed(2)}`;
    
    // Create or update status bar items
    if (!statusBarItems.cpu) {
        statusBarItems.cpu = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItems.cpu.command = 'vsblue.showPerformanceDetails';
        statusBarItems.cpu.tooltip = 'Show Performance Details';
    }
    statusBarItems.cpu.text = cpuText;
    statusBarItems.cpu.show();
    
    if (!statusBarItems.memory) {
        statusBarItems.memory = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        statusBarItems.memory.command = 'vsblue.showMemoryDetails';
        statusBarItems.memory.tooltip = 'Show Memory Details';
    }
    statusBarItems.memory.text = memoryText;
    statusBarItems.memory.show();
    
    if (!statusBarItems.load) {
        statusBarItems.load = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
        statusBarItems.load.command = 'vsblue.showSystemDetails';
        statusBarItems.load.tooltip = 'Show System Details';
    }
    statusBarItems.load.text = loadText;
    statusBarItems.load.show();
}

/**
 * Updates all open panels with the latest metrics
 */
function updateAllPanels(metrics: PerformanceMetrics): void {
    // Update performance panel if open
    if (performancePanel) {
        performancePanel.webview.html = getPerformanceDetailsHtml(metrics);
    }
    
    // Update memory panel if open
    if (memoryPanel) {
        memoryPanel.webview.html = getMemoryDetailsHtml(metrics);
    }
    
    // Update system panel if open
    if (systemPanel) {
        systemPanel.webview.html = getSystemDetailsHtml(metrics);
    }
    
    // Update extension panel if open
    if (extensionPanel) {
        extensionPanel.webview.html = getExtensionDetailsHtml(metrics);
    }
    
    // Update editor panel if open
    if (editorPanel) {
        editorPanel.webview.html = getEditorDetailsHtml(metrics);
    }
    
    // Update GC panel if open
    if (gcPanel) {
        gcPanel.webview.html = getGCDetailsHtml(metrics);
    }
}

/**
 * Toggles monitoring on/off
 */
function toggleMonitoring(): void {
    if (isMonitoring) {
        stopMonitoring();
    } else {
        startMonitoring();
    }
}

/**
 * Starts performance monitoring
 */
function startMonitoring(): void {
    if (isMonitoring) {
        return;
    }
    
    isMonitoring = true;
    
    // Get initial metrics
    const initialMetrics = getMetrics();
    if (initialMetrics) {
        currentMetrics = initialMetrics;
        updateStatusBar(initialMetrics);
        updateAllPanels(initialMetrics);
    }
    
    // Start watching for metrics updates
    const watcher = watch((metrics: PerformanceMetrics) => {
        currentMetrics = metrics;
        updateStatusBar(metrics);
        updateAllPanels(metrics);
    });
    
    // Store the stop function
    if (watcher) {
        stopWatching = watcher;
    } else {
        stopWatching = null;
    }
    
    vscode.window.showInformationMessage('Performance monitoring started');
}

/**
 * Stops performance monitoring
 */
function stopMonitoring(): void {
    if (!isMonitoring) {
        return;
    }
    
    isMonitoring = false;
    
    // Stop watching for metrics updates
    if (stopWatching) {
        stopWatching();
        stopWatching = null;
    }
    
    // Clear status bar items
    if (statusBarItems.cpu) {
        statusBarItems.cpu.hide();
        statusBarItems.cpu.dispose();
        delete statusBarItems.cpu;
    }
    if (statusBarItems.memory) {
        statusBarItems.memory.hide();
        statusBarItems.memory.dispose();
        delete statusBarItems.memory;
    }
    if (statusBarItems.load) {
        statusBarItems.load.hide();
        statusBarItems.load.dispose();
        delete statusBarItems.load;
    }
    
    vscode.window.showInformationMessage('Performance monitoring stopped');
}
