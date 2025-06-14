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
exports.MemoryManager = void 0;
const os = __importStar(require("os"));
const vscode = __importStar(require("vscode"));
class MemoryManager {
    constructor(context) {
        this.disposables = [];
        this.MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
        this.HIGH_MEMORY_THRESHOLD = 0.8; // 80%
        this.CRITICAL_MEMORY_THRESHOLD = 0.9; // 90%
        this.lastOptimizationTime = 0;
        this.OPTIMIZATION_COOLDOWN = 300000; // 5 minutes
        this.memoryHistory = [];
        this.HISTORY_SIZE = 10;
        this.isOptimizing = false;
        this.context = context;
        this.startMonitoring();
    }
    startMonitoring() {
        const interval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.MEMORY_CHECK_INTERVAL);
        this.disposables.push({ dispose: () => clearInterval(interval) });
        // Monitor workspace changes
        const workspaceDisposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.checkMemoryUsage();
        });
        // Monitor editor changes
        const editorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
            this.checkMemoryUsage();
        });
        this.disposables.push(workspaceDisposable, editorDisposable);
    }
    async checkMemoryUsage() {
        const usage = this.getMemoryUsage();
        this.updateMemoryHistory(usage);
        if (usage > this.CRITICAL_MEMORY_THRESHOLD) {
            await this.applyCriticalOptimizations();
        }
        else if (usage > this.HIGH_MEMORY_THRESHOLD) {
            await this.applyHighMemoryOptimizations();
        }
        // Check for memory leaks
        if (this.detectMemoryLeak()) {
            await this.handleMemoryLeak();
        }
    }
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return usage.heapUsed / usage.heapTotal;
    }
    updateMemoryHistory(usage) {
        this.memoryHistory.push(usage);
        if (this.memoryHistory.length > this.HISTORY_SIZE) {
            this.memoryHistory.shift();
        }
    }
    detectMemoryLeak() {
        if (this.memoryHistory.length < this.HISTORY_SIZE) {
            return false;
        }
        // Check for consistent growth
        let growthCount = 0;
        let totalGrowth = 0;
        let consecutiveGrowth = 0;
        let maxConsecutiveGrowth = 0;
        for (let i = 1; i < this.memoryHistory.length; i++) {
            const growth = this.memoryHistory[i] - this.memoryHistory[i - 1];
            if (growth > 0) {
                growthCount++;
                totalGrowth += growth;
                consecutiveGrowth++;
                maxConsecutiveGrowth = Math.max(maxConsecutiveGrowth, consecutiveGrowth);
            }
            else {
                consecutiveGrowth = 0;
            }
        }
        const averageGrowth = totalGrowth / growthCount;
        const growthPercentage = (growthCount / (this.HISTORY_SIZE - 1)) * 100;
        // Get current memory stats
        const usage = process.memoryUsage();
        const heapFragmentation = (usage.heapTotal - usage.heapUsed) / usage.heapTotal * 100;
        // Memory leak is likely if:
        // 1. High percentage of measurements show growth
        // 2. Significant average growth rate
        // 3. Long consecutive growth periods
        // 4. High heap fragmentation
        return (growthPercentage > 70 && // More than 70% of measurements show growth
            averageGrowth > 0.02 && // Significant average growth
            maxConsecutiveGrowth >= 3 && // At least 3 consecutive growth periods
            heapFragmentation > 30 // High heap fragmentation
        );
    }
    async applyCriticalOptimizations() {
        if (this.isOptimizing || Date.now() - this.lastOptimizationTime < this.OPTIMIZATION_COOLDOWN) {
            return;
        }
        this.isOptimizing = true;
        try {
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            // Clear editor history
            await vscode.commands.executeCommand('workbench.action.clearEditorHistory');
            // Close unused editors
            const visibleEditors = vscode.window.visibleTextEditors;
            const activeEditor = vscode.window.activeTextEditor;
            for (const editor of visibleEditors) {
                if (editor !== activeEditor) {
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                }
            }
            // Clear terminal buffers
            vscode.window.terminals.forEach(terminal => {
                terminal.sendText('clear');
            });
            // Disable heavy features
            await vscode.workspace.getConfiguration().update('editor.minimap.enabled', false, true);
            await vscode.workspace.getConfiguration().update('editor.smoothScrolling', false, true);
            await vscode.workspace.getConfiguration().update('workbench.list.smoothScrolling', false, true);
            // Clear extension cache
            await this.clearExtensionCache();
            this.lastOptimizationTime = Date.now();
        }
        finally {
            this.isOptimizing = false;
        }
    }
    async applyHighMemoryOptimizations() {
        if (this.isOptimizing || Date.now() - this.lastOptimizationTime < this.OPTIMIZATION_COOLDOWN) {
            return;
        }
        this.isOptimizing = true;
        try {
            // Optimize editor settings
            await vscode.workspace.getConfiguration().update('editor.renderWhitespace', 'none', true);
            await vscode.workspace.getConfiguration().update('editor.renderControlCharacters', false, true);
            await vscode.workspace.getConfiguration().update('editor.occurrencesHighlight', false, true);
            await vscode.workspace.getConfiguration().update('editor.selectionHighlight', false, true);
            // Optimize file watching
            const watchExclude = vscode.workspace.getConfiguration('files').get('watcherExclude');
            watchExclude['**/node_modules/**'] = true;
            watchExclude['**/dist/**'] = true;
            watchExclude['**/build/**'] = true;
            await vscode.workspace.getConfiguration().update('files.watcherExclude', watchExclude, true);
            // Clear search history
            await vscode.commands.executeCommand('search.clearHistory');
            this.lastOptimizationTime = Date.now();
        }
        finally {
            this.isOptimizing = false;
        }
    }
    async handleMemoryLeak() {
        const lastWarning = this.context.globalState.get('lastMemoryLeakWarning', 0);
        const now = Date.now();
        if (now - lastWarning > 300000) { // 5 minutes
            const action = await vscode.window.showWarningMessage('Potential memory leak detected. Would you like to analyze and fix?', 'Analyze', 'Optimize', 'Ignore');
            if (action === 'Analyze') {
                await this.analyzeMemoryUsage();
            }
            else if (action === 'Optimize') {
                await this.applyCriticalOptimizations();
            }
            this.context.globalState.update('lastMemoryLeakWarning', now);
        }
    }
    async analyzeMemoryUsage() {
        const usage = process.memoryUsage();
        const heapStats = {
            used: this.formatBytes(usage.heapUsed),
            total: this.formatBytes(usage.heapTotal),
            external: this.formatBytes(usage.external || 0),
            arrayBuffers: this.formatBytes(usage.arrayBuffers || 0)
        };
        // Calculate memory growth rate
        const growthRate = this.calculateGrowthRate();
        const fragmentation = ((usage.heapTotal - usage.heapUsed) / usage.heapTotal * 100).toFixed(2);
        const report = `Memory Usage Analysis:
- Heap Used: ${heapStats.used}
- Heap Total: ${heapStats.total}
- External Memory: ${heapStats.external}
- Array Buffers: ${heapStats.arrayBuffers}
- Memory Growth Rate: ${growthRate.toFixed(2)}% per interval
- Heap Fragmentation: ${fragmentation}%
- Active Editors: ${vscode.window.visibleTextEditors.length}
- Extensions: ${vscode.extensions.all.length}
- System Memory: ${this.formatBytes(os.totalmem() - os.freemem())} / ${this.formatBytes(os.totalmem())}

Memory History:
${this.memoryHistory.map((usage, i) => `  ${i + 1}. ${(usage * 100).toFixed(2)}%`).join('\n')}`;
        const output = vscode.window.createOutputChannel('VS Blue Memory Analysis');
        output.appendLine(report);
        output.show();
    }
    calculateGrowthRate() {
        if (this.memoryHistory.length < 2) {
            return 0;
        }
        const firstUsage = this.memoryHistory[0];
        const lastUsage = this.memoryHistory[this.memoryHistory.length - 1];
        const timeSpan = this.HISTORY_SIZE * this.MEMORY_CHECK_INTERVAL;
        return ((lastUsage - firstUsage) / firstUsage) * 100;
    }
    async clearExtensionCache() {
        try {
            // Clear extension storage
            await this.context.globalState.update('vsblue.cache', undefined);
            // Clear workspace storage
            await this.context.workspaceState.update('vsblue.workspaceCache', undefined);
            // Clear extension cache directory
            const cachePath = this.context.globalStoragePath;
            if (cachePath) {
                const fs = require('fs');
                const path = require('path');
                const cacheDir = path.join(cachePath, 'cache');
                if (fs.existsSync(cacheDir)) {
                    fs.rmSync(cacheDir, { recursive: true, force: true });
                }
            }
        }
        catch (error) {
            console.error('Failed to clear extension cache:', error);
        }
    }
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=memoryManager.js.map