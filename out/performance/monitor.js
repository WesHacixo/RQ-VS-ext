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
exports.PerformanceMonitor = void 0;
const os = __importStar(require("os"));
const vscode = __importStar(require("vscode"));
class CircularBuffer {
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = [];
        this.index = 0;
        this._length = 0;
    }
    push(item) {
        if (this._length < this.capacity) {
            this.buffer.push(item);
            this._length++;
        }
        else {
            this.buffer[this.index] = item;
        }
        this.index = (this.index + 1) % this.capacity;
    }
    toArray() {
        if (this._length < this.capacity) {
            return [...this.buffer];
        }
        return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
    }
    get length() {
        return this._length;
    }
    clear() {
        this.buffer = [];
        this.index = 0;
        this._length = 0;
    }
}
class PerformanceMonitor {
    constructor(context, options) {
        this._lastOptimizationTime = 0;
        this._lastGCTime = 0;
        this._gcCount = 0;
        this._memoryLeakDetected = false;
        // Insights and state tracking
        this._insights = [];
        this._lastCleanupTime = 0;
        this.isMonitoring = false;
        this.disposables = [];
        this.lastMemoryCheck = 0;
        this.lastMemoryCheckTime = 0;
        this.gcCount = 0;
        this.lastGCTime = 0;
        this.lastGCDuration = 0;
        this.memoryBeforeGC = 0;
        this.memoryAfterGC = 0;
        this.lastOptimizationTime = 0;
        this.monitoringStartTime = Date.now();
        this.context = context;
        this.options = { ...PerformanceMonitor.DEFAULT_OPTIONS, ...options };
        this.metrics = this.createInitialMetrics();
        this.memoryHistory = new CircularBuffer(this.options.historySize);
        this.cpuHistory = new CircularBuffer(this.options.historySize);
        this.loadHistory = new CircularBuffer(this.options.historySize);
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'vsblue.showPerformanceDashboard';
        this.disposables = [this.statusBarItem];
        this._lastCleanupTime = Date.now();
        this._lastOptimizationTime = 0;
        this._memoryLeakDetected = false;
        this._insights = [];
        this.setupGCMonitoring();
    }
    /**
     * Creates initial metrics object with default values
     */
    createInitialMetrics() {
        return {
            cpu: 0,
            memory: 0,
            loadAverage: [0, 0, 0],
            uptime: 0,
            extensionCount: 0,
            activeEditors: 0,
            memoryHistory: [],
            cpuHistory: [],
            heapStats: {
                used: 0,
                total: 0,
                external: 0,
                arrayBuffers: 0,
                fragmentation: 0
            },
            gcStats: {
                lastGCTime: 0,
                gcCount: 0,
                gcDuration: 0,
                memoryBeforeGC: 0,
                memoryAfterGC: 0
            },
            networkStats: {
                bytesIn: 0,
                bytesOut: 0,
                connections: 0
            },
            loadHistory: [],
            activeExtensions: 0
        };
    }
    /**
     * Sets up garbage collection monitoring
     */
    setupGCMonitoring() {
        // Track GC events using performance hooks
        if (typeof performance !== 'undefined' && performance.getEntriesByType) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    if (entry.entryType === 'gc') {
                        this.handleGCEvent(entry);
                    }
                }
            });
            observer.observe({ entryTypes: ['gc'] });
            this.disposables.push({
                dispose: () => observer.disconnect()
            });
        }
    }
    /**
     * Handles GC event from performance observer
     */
    handleGCEvent(entry) {
        const now = Date.now();
        const memory = process.memoryUsage();
        this.lastGCTime = now;
        this.gcCount++;
        this.lastGCDuration = entry.duration || 0;
        this.memoryBeforeGC = this.metrics.heapStats.used;
        this.memoryAfterGC = memory.heapUsed;
        // Update metrics
        this.metrics.gcStats = {
            lastGCTime: now,
            gcCount: this.gcCount,
            gcDuration: this.lastGCDuration,
            memoryBeforeGC: this.memoryBeforeGC,
            memoryAfterGC: this.memoryAfterGC
        };
    }
    /**
     * Collects and updates performance metrics
     */
    updateHistory() {
        if (!this.metrics)
            return;
        try {
            // Add current metrics to history buffers
            this.memoryHistory.push(this.metrics.memory.used);
            this.cpuHistory.push(this.metrics.cpu);
            this.loadHistory.push(this.metrics.loadAverage[0]);
            // Update metrics with history (slice to ensure we don't have reference issues)
            this.metrics.memoryHistory = [...this.memoryHistory.toArray()];
            this.metrics.cpuHistory = [...this.cpuHistory.toArray()];
            this.metrics.loadHistory = [...this.loadHistory.toArray()];
            // Check for memory leaks
            if (this.detectMemoryLeak()) {
                this.handleMemoryLeak();
            }
            // Check if optimization is needed
            this.checkForOptimizations();
            // Update status bar
            this.updateStatusBar();
        }
        catch (error) {
            console.error('Error updating history:', error);
        }
    }
    updateStatusBar() {
        if (!this.metrics)
            return;
        try {
            const memoryUsage = this.formatBytes(this.metrics.memory.used);
            const memoryTotal = this.formatBytes(this.metrics.memory.total);
            const memoryPercent = this.metrics.memory.percentage.toFixed(1);
            const cpuPercent = this.metrics.cpu.toFixed(1);
            const loadAvg = this.metrics.loadAverage[0].toFixed(2);
            this.statusBarItem.text = `$(pulse) ${memoryPercent}% (${memoryUsage}/${memoryTotal}) | CPU: ${cpuPercent}% | Load: ${loadAvg}`;
            // Set color based on memory usage
            if (this.metrics.memory.percentage > 90) {
                this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
            }
            else if (this.metrics.memory.percentage > 70) {
                this.statusBarItem.color = new vscode.ThemeColor('warningForeground');
            }
            else {
                this.statusBarItem.color = undefined; // Reset to default
            }
            this.statusBarItem.show();
        }
        catch (error) {
            console.error('Error updating status bar:', error);
        }
    }
    formatBytes(bytes) {
        if (isNaN(bytes) || !isFinite(bytes))
            return '0 B';
        if (bytes === 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
        // Handle negative numbers
        const sign = bytes < 0 ? '-' : '';
        const absBytes = Math.abs(bytes);
        const size = parseFloat((absBytes / Math.pow(1024, i)).toFixed(2));
        return `${sign}${size} ${units[i]}`;
    }
    detectMemoryLeak() {
        if (!this.metrics || this.memoryHistory.size() < 10) {
            return false;
        }
        try {
            const history = this.memoryHistory.toArray();
            const recent = history.slice(-10); // Last 10 samples
            const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
            // Check if memory is consistently increasing
            const increasing = recent.every((val, i, arr) => i === 0 || val >= arr[i - 1]);
            // Check if memory is above 80% of the total
            const threshold = this.metrics.memory.total * 0.8;
            return increasing && avg > threshold;
        }
        catch (error) {
            console.error('Error detecting memory leak:', error);
            return false;
        }
    }
    handleMemoryLeak() {
        if (!this.metrics)
            return;
        const message = 'Potential memory leak detected! Memory usage is consistently increasing.';
        vscode.window.showWarningMessage(message, 'Optimize Now', 'Dismiss').then(selection => {
            if (selection === 'Optimize Now') {
                this.optimizeMemory();
            }
        });
    }
    optimizeMemory() {
        const startTime = Date.now();
        const beforeMemory = process.memoryUsage().heapUsed;
        return new Promise((resolve) => {
            try {
                // Clear caches
                this.clearCaches();
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                // Update metrics
                this.collectMetrics();
                const afterMemory = process.memoryUsage().heapUsed;
                const savings = beforeMemory - afterMemory;
                const duration = Date.now() - startTime;
                resolve({ savings, duration });
            }
            catch (error) {
                console.error('Error during memory optimization:', error);
                resolve({ savings: 0, duration: Date.now() - startTime });
            }
        });
    }
    checkForOptimizations() {
        if (!this.metrics)
            return;
        const memoryUsage = this.metrics.heapStats.used / this.metrics.heapStats.total;
        if (memoryUsage > 0.8) { // 80% memory usage
            const message = `High memory usage (${(memoryUsage * 100).toFixed(1)}%). Would you like to optimize?`;
            vscode.window.showWarningMessage(message, 'Optimize Now', 'Later').then(selection => {
                if (selection === 'Optimize Now') {
                    this.optimizeMemory();
                }
            });
        }
    }
    collectMetrics() {
        try {
            if (!this.metrics) {
                this.metrics = this.createInitialMetrics();
                return;
            }
            const memory = process.memoryUsage();
            const cpu = os.loadavg();
            const now = Date.now();
            // Update metrics
            this.metrics.cpu = cpu[0];
            // Update memory usage in the heapStats object
            this.metrics.heapStats.used = memory.heapUsed;
            this.metrics.loadAverage = [cpu[0], cpu[1], cpu[2]];
            this.metrics.uptime = process.uptime();
            this.metrics.extensionCount = vscode.extensions.all.length;
            this.metrics.activeEditors = vscode.window.visibleTextEditors.length;
            this.metrics.activeExtensions = vscode.extensions.all.filter(ext => ext.isActive).length;
            // Update heap stats
            this.metrics.heapStats = {
                used: memory.heapUsed,
                total: memory.heapTotal,
                external: memory.external || 0,
                arrayBuffers: memory.arrayBuffers || 0,
                fragmentation: memory.heapTotal > 0 ?
                    (1 - (memory.heapUsed / memory.heapTotal)) * 100 : 0
            };
            // Update history
            this.updateHistory();
            // Check for memory leaks
            if (this.detectMemoryLeak()) {
                this.handleMemoryLeak();
            }
            // Update status bar
            this.updateStatusBar();
            // Check for optimization opportunities
            this.checkForOptimizations();
        }
        catch (error) {
            console.error('Error collecting metrics:', error);
        }
    }
    /**
     * Updates history buffers with current metrics
     */
    updateHistory() {
        if (!this.metrics)
            return;
        try {
            // Add current metrics to history
            this.memoryHistory.push(this.metrics.heapStats.used);
            this.cpuHistory.push(this.metrics.cpu);
            // Ensure loadAverage has values before accessing
            if (this.metrics.loadAverage && this.metrics.loadAverage.length > 0) {
                this.loadHistory.push(this.metrics.loadAverage[0]);
            }
            else {
                this.loadHistory.push(0);
            }
            // Update metrics with history (create new arrays to avoid reference issues)
            this.metrics.memoryHistory = [...this.memoryHistory.toArray()];
            this.metrics.cpuHistory = [...this.cpuHistory.toArray()];
            this.metrics.loadHistory = [...this.loadHistory.toArray()];
        }
        catch (error) {
            console.error('Error updating history:', error);
        }
    }
    /**
     * Updates the status bar with current metrics
     */
    updateStatusBar() {
        try {
            if (!this.statusBarItem || !this.metrics)
                return;
            const memory = process.memoryUsage();
            const memoryUsed = this.formatBytes(memory.heapUsed);
            const memoryTotal = this.formatBytes(memory.heapTotal);
            const cpu = this.metrics.cpu ? this.metrics.cpu.toFixed(1) : '0.0';
            this.statusBarItem.text = `$(pulse) ${cpu}% CPU | ${memoryUsed} / ${memoryTotal}`;
            this.statusBarItem.tooltip = `VS Blue Performance Monitor\n` +
                `CPU: ${cpu}%\n` +
                `Memory: ${memoryUsed} / ${memoryTotal}\n` +
                `Uptime: ${Math.floor(process.uptime() / 60)}m`;
            this.statusBarItem.show();
        }
        catch (error) {
            console.error('Error updating status bar:', error);
        }
    }
    /**
     * Formats bytes to human readable string
     */
    formatBytes(bytes) {
        if (isNaN(bytes) || !isFinite(bytes))
            return '0 B';
        if (bytes === 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
        // Handle negative numbers
        const sign = bytes < 0 ? '-' : '';
        const absBytes = Math.abs(bytes);
        const size = parseFloat((absBytes / Math.pow(1024, i)).toFixed(2));
        return `${sign}${size} ${units[i]}`;
        this._insights.push({
            type: 'memory-leak',
            message: 'Memory usage is growing without expected cleanup',
            timestamp: Date.now(),
            severity: 'warning'
        });
    }
    /**
     * Handles garbage collection events
     */
    onGarbageCollected(info) {
        const message = `VS Blue: Garbage collection freed ${(info.memoryFreed / (1024 * 1024)).toFixed(1)}MB`;
        this._insights.push({
            type: 'gc',
            message,
            timestamp: Date.now(),
            severity: 'info'
        });
        vscode.window.showInformationMessage(message);
    }
    /**
     * Optimizes memory usage using various strategies
     * @param redcodeMode Whether to use aggressive optimization (default: false)
     * @returns Promise that resolves when optimization is complete
     */
    async optimizeMemory(aggressive = false) {
        return new Promise((resolve) => {
            try {
                if (!this.metrics) {
                    resolve();
                    return;
                }
                // Store current metrics for comparison
                const before = { ...this.metrics.memory };
                // Run garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                // Clear caches
                this.clearCaches();
                // Update metrics after cleanup
                this.collectMetrics();
                // Calculate memory saved
                const saved = before.used - (this.metrics?.memory.used || 0);
                const savedPercentage = (saved / before.total) * 100;
                // Show notification if significant memory was saved
                if (saved > 0) {
                    const message = `Freed ${this.formatBytes(saved)} (${savedPercentage.toFixed(1)}%) of memory`;
                    vscode.window.showInformationMessage(message);
                }
                // Reset optimization timer
                this._lastOptimizationTime = Date.now();
                resolve();
            }
            catch (error) {
                console.error('Error optimizing memory:', error);
                vscode.window.showErrorMessage('Failed to optimize memory: ' + error.message);
                resolve();
            }
        });
    }
    /**
     * Clears various caches and temporary data
     */
    clearCaches() {
        try {
            // Clear VS Code caches
            vscode.workspace.textDocuments.forEach(doc => {
                if (doc.isDirty)
                    return; // Skip unsaved documents
                try {
                    // Close and reopen the document to clear its cache
                    const uri = doc.uri;
                    const viewColumn = vscode.ViewColumn.Active;
                    vscode.window.visibleTextEditors
                        .filter(editor => editor.document.uri.toString() === uri.toString())
                        .forEach(editor => {
                        vscode.window.showTextDocument(editor.document, {
                            viewColumn: viewColumn,
                            preview: false,
                            preserveFocus: true
                        });
                    });
                }
                catch (error) {
                    console.error('Error clearing document cache:', error);
                }
            });
            // Clear require cache
            for (const key in require.cache) {
                if (!key.includes('node_modules') && key.endsWith('.js')) {
                    delete require.cache[key];
                }
            }
            // Clear any custom caches
            if (this._cache) {
                this._cache.clear();
            }
        }
        catch (error) {
            console.error('Error clearing caches:', error);
        }
        try {
            // Clear VS Code caches
            vscode.workspace.textDocuments.forEach(doc => {
                if (doc.isDirty)
                    return; // Skip unsaved documents
                if (doc.isClosed)
                    return; // Skip already closed documents
                // Close and re-open the document to clear its cache
                const uri = doc.uri;
                vscode.window.visibleTextEditors
                    .filter(editor => editor.document.uri.toString() === uri.toString())
                    .forEach(editor => {
                    vscode.window.showTextDocument(uri, { preview: false, viewColumn: editor.viewColumn });
                });
            });
            // Clear any other caches if needed
            if ('clearCache' in require.cache) {
                require.cache.clearCache();
            }
        }
        catch (error) {
            console.error('Error clearing caches:', error);
        }
    }
    /**
     * Optimizes editor settings for better performance
     */
    async _optimizeEditorSettings(actions, aggressive) {
        const config = vscode.workspace.getConfiguration();
        const settingsToUpdate = [
            ['files.autoSave', aggressive ? 'off' : 'afterDelay', 'Auto-save'],
            ['editor.formatOnSave', false, 'Format on save'],
            ['editor.formatOnPaste', false, 'Format on paste'],
            ['editor.codeLens', false, 'CodeLens'],
            ['editor.minimap.enabled', !aggressive, 'Minimap'],
            ['editor.occurrencesHighlight', !aggressive, 'Occurrences highlight'],
            ['editor.renderWhitespace', aggressive ? 'none' : 'selection', 'Whitespace rendering'],
            ['workbench.editor.enablePreview', !aggressive, 'Preview editors'],
            ['workbench.list.smoothScrolling', false, 'Smooth scrolling'],
            ['workbench.tree.renderIndentGuides', 'none', 'Indent guides']
        ];
        for (const [key, value, name] of settingsToUpdate) {
            try {
                const currentValue = config.get(key);
                if (currentValue !== value) {
                    await config.update(key, value, vscode.ConfigurationTarget.Workspace);
                    actions.push(`${name} ${value === false ? 'disabled' : 'set to ' + value}`);
                }
            }
            catch (error) {
                console.error(`Failed to update setting ${key}:`, error);
            }
        }
    }
    /**
     * Displays the results of the memory optimization
     */
    async _showOptimizationResults(record, redcodeMode) {
        const savingsMB = (record.savings / (1024 * 1024)).toFixed(2);
        const duration = (record.duration / 1000).toFixed(1);
        // Show detailed notification with actions
        const result = await vscode.window.showInformationMessage(`✅ ${redcodeMode ? 'REDCODE' : 'VS Blue'}: Memory optimization complete`, 'Show Details', 'Dismiss');
        if (result === 'Show Details') {
            const panel = vscode.window.createWebviewPanel('optimizationResults', 'Memory Optimization Results', vscode.ViewColumn.Beside, { enableScripts: true });
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: var(--vscode-font-family); padding: 20px; }
                        h1 { color: var(--vscode-foreground); }
                        .success { color: #4caf50; }
                        .detail { margin: 10px 0; }
                        .action { 
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            padding: 5px 10px;
                            margin: 5px 0;
                            display: inline-block;
                            border-radius: 2px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Memory Optimization Complete</h1>
                    <div class="success">✅ Saved ${savingsMB}MB in ${duration} seconds</div>
                    <h3>Actions Performed:</h3>
                    <ul>
                        ${record.actions.map((action) => `<li>${action}</li>`).join('\n')}
                    </ul>
                    <div class="detail">
                        <strong>Mode:</strong> ${record.mode.toUpperCase()}<br>
                        <strong>Memory Before:</strong> ${(record.memoryBefore / (1024 * 1024)).toFixed(2)}MB<br>
                        <strong>Memory After:</strong> ${(record.memoryAfter / (1024 * 1024)).toFixed(2)}MB<br>
                        <strong>Time:</strong> ${new Date(record.timestamp).toLocaleString()}
                    </div>
                </body>
                </html>
            `;
        }
    }
    /**
     * Performs any necessary cleanup after optimization
     */
    _cleanupAfterOptimization() {
        // Clear any temporary resources
        this._cleanupCache();
        // Update status bar with current memory usage
        const memory = process.memoryUsage();
        const usedMB = (memory.heapUsed / (1024 * 1024)).toFixed(1);
        const totalMB = (memory.heapTotal / (1024 * 1024)).toFixed(1);
        this.statusBarItem.text = `$(memory) ${usedMB}MB / ${totalMB}MB`;
        this.statusBarItem.tooltip = 'VS Blue: Memory Usage';
        this.statusBarItem.show();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Static configuration with default values
PerformanceMonitor.DEFAULT_OPTIONS = {
    monitoringInterval: 5000, // 5 seconds
    historySize: 60, // 1 minute of history at 1s intervals
    warningThreshold: 80, // 80% memory usage
    emergencyThreshold: 95, // 95% memory usage
    gcDetectionThreshold: 3, // 3 consecutive GCs
    optimizationCooldown: 30000, // 30 seconds
    maxHistorySize: 3600 // 1 hour at 1s intervals
};
_updateStatusBar(savings, number);
void {
    try: {
        const: savingsMB = (savings / (1024 * 1024)).toFixed(1),
        this: .statusBarItem.text = `VS Blue: Saved ${savingsMB}MB`,
        this: .statusBarItem.show(),
        setTimeout() { }
    }(), this: .statusBarItem.hide(), 5000: 
};
try { }
catch (error) {
    console.error('Error updating status bar:', error);
}
getOptimizationHistory();
typeof this._optimizationHistory;
{
    return this._optimizationHistory;
}
getTotalSavings();
number;
{
    return this._optimizationHistory.reduce((total, opt) => total + opt.savings, 0);
}
getAverageSavings();
number;
{
    if (this._optimizationHistory.length === 0) {
        return 0;
    }
    return this.getTotalSavings() / this._optimizationHistory.length;
}
async;
_findUnusedExtensions();
Promise < vscode.Extension < any > [] > {
    const: extensions = vscode.extensions.all,
    const: unusedExtensions, vscode, : .Extension < any > [], []: ,
    const: lastUsedThreshold = 7 * 24 * 60 * 60 * 1000, // 7 days
    for(, ext, of, extensions) {
        if (!ext.isActive) {
            const lastUsed = await this._getExtensionLastUsed(ext.id);
            if (lastUsed && Date.now() - lastUsed > lastUsedThreshold) {
                unusedExtensions.push(ext);
            }
        }
    },
    return: unusedExtensions
};
async;
_getExtensionLastUsed(extensionId, string);
Promise < number | null > {
    const: config = vscode.workspace.getConfiguration('vsblue'),
    const: lastUsed = config.get(`extensions.${extensionId}.lastUsed`),
    return: lastUsed || null
};
getTimeBasedInsights();
string[];
{
    const insights = [];
    const now = Date.now();
    const metrics = this._metricsHistory;
    if (metrics.length < 2) {
        return ['Insufficient data for time-based insights'];
    }
    // Calculate average memory usage by hour
    const hourlyAverages = new Map();
    metrics.forEach(metric => {
        const hour = new Date(metric.timestamp).getHours();
        if (!hourlyAverages.has(hour)) {
            hourlyAverages.set(hour, []);
        }
        hourlyAverages.get(hour)?.push(metric.memory);
    });
    // Find peak memory usage hours
    let peakHour = 0;
    let peakAverage = 0;
    hourlyAverages.forEach((values, hour) => {
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        if (average > peakAverage) {
            peakAverage = average;
            peakHour = hour;
        }
    });
    insights.push(`Peak memory usage typically occurs at ${peakHour}:00`);
    // Check if optimization is needed
    if (now - this._lastOptimizationTime > this._optimizationInterval) {
        insights.push('Memory optimization recommended (30 minutes since last optimization)');
    }
    // Check for memory leaks
    const recentMetrics = metrics.slice(-10);
    const memoryTrend = recentMetrics.map(m => m.memory);
    const isIncreasing = memoryTrend.every((val, idx) => idx === 0 || val > memoryTrend[idx - 1]);
    if (isIncreasing) {
        insights.push('Potential memory leak detected (continuous increase in memory usage)');
    }
    return insights;
}
async;
_handleMemoryPressure();
Promise < void  > {
    const: memoryUsage = process.memoryUsage(),
    const: heapUsedRatio = memoryUsage.heapUsed / memoryUsage.heapTotal,
    if(heapUsedRatio) { }
} > 0.9;
{
    // Critical memory pressure
    await this.optimizeMemory(true); // Force REDCODE mode
    console.info('Critical memory pressure detected, forced REDCODE mode');
}
if (heapUsedRatio > 0.8) {
    // High memory pressure
    await this.optimizeMemory(false);
    console.info('High memory pressure detected, running optimizations');
}
else if (heapUsedRatio > 0.7) {
    // Moderate memory pressure
    this._cleanupCache();
    console.debug('Moderate memory pressure detected, cleaning cache');
}
// Update status bar with memory pressure indicator
this._updateStatusBar(heapUsedRatio);
_cleanupCache();
void {
    const: now = Date.now(),
    const: CLEANUP_INTERVAL = 5 * 60 * 1000, // 5 minutes
    if(now) { }
} - (this._lastCleanupTime || 0) < CLEANUP_INTERVAL;
{
    return;
}
this._lastCleanupTime = now;
this._lastCleanupTime = now;
// Clear old insights
const oldInsights = this._insights.filter(insight => now - insight.timestamp > this.INSIGHT_TTL);
oldInsights.forEach(insight => {
    const index = this._insights.indexOf(insight);
    if (index > -1) {
        this._insights.splice(index, 1);
    }
});
// Force garbage collection if available
if (typeof global.gc === 'function') {
    global.gc();
}
//# sourceMappingURL=monitor.js.map