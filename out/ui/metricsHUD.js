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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsHUD = void 0;
const os_1 = __importDefault(require("os"));
const vscode = __importStar(require("vscode"));
class MetricsHUD {
    constructor(context) {
        this.isVisible = false;
        this.statusBarItems = new Map();
        this.UPDATE_INTERVAL = 2000; // Update every 2 seconds
        this.MAX_HISTORY = 100; // Maximum number of historical values to keep
        this.metricsHistory = {
            cpu: [],
            memory: [],
            load: []
        };
        this.disposables = [];
        this.lastUpdateTime = 0;
        this.MIN_UPDATE_INTERVAL = 1000; // Minimum time between updates (ms)
        this.updateQueue = [];
        this.isUpdating = false;
        this.context = context;
        this.initializeMetricsHistory();
    }
    initializeMetricsHistory() {
        const historySize = 10;
        this.metricsHistory = {
            cpu: new Array(historySize).fill(0),
            memory: new Array(historySize).fill(0),
            load: new Array(historySize).fill(0)
        };
    }
    show() {
        if (this.isVisible) {
            return;
        }
        try {
            this.isVisible = true;
            this.createStatusBarItems();
            this.startUpdates();
            this.updateMetrics();
        }
        catch (error) {
            console.error('Error showing HUD:', error);
            this.isVisible = false;
            this.hide();
        }
    }
    hide() {
        if (!this.isVisible) {
            return;
        }
        try {
            this.isVisible = false;
            this.stopUpdates();
            this.disposeStatusBarItems();
            this.clearMetricsHistory();
        }
        catch (error) {
            console.error('Error hiding HUD:', error);
        }
    }
    toggle() {
        if (this.isVisible) {
            this.hide();
        }
        else {
            this.show();
        }
    }
    createStatusBarItems() {
        // CPU Usage
        const cpuItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        cpuItem.command = 'vsblue.showPerformanceDetails';
        cpuItem.show();
        this.statusBarItems.set('cpu', cpuItem);
        // Memory Usage
        const memoryItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        memoryItem.command = 'vsblue.showMemoryDetails';
        memoryItem.show();
        this.statusBarItems.set('memory', memoryItem);
        // Load Average
        const loadItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
        loadItem.command = 'vsblue.showSystemDetails';
        loadItem.show();
        this.statusBarItems.set('load', loadItem);
        // Active Extensions
        const extensionsItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
        extensionsItem.command = 'vsblue.showExtensionDetails';
        extensionsItem.show();
        this.statusBarItems.set('extensions', extensionsItem);
        // Active Editors
        const editorsItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 96);
        editorsItem.command = 'vsblue.showEditorDetails';
        editorsItem.show();
        this.statusBarItems.set('editors', editorsItem);
        // GC Status
        const gcItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 95);
        gcItem.command = 'vsblue.showGCDetails';
        gcItem.show();
        this.statusBarItems.set('gc', gcItem);
    }
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateMetrics(), this.UPDATE_INTERVAL);
    }
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
    }
    updateMetrics(metrics) {
        if (!this.isVisible) {
            return;
        }
        try {
            const now = Date.now();
            if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
                this.updateQueue.push(() => this.updateMetrics(metrics));
                if (!this.isUpdating) {
                    this.processUpdateQueue();
                }
                return;
            }
            this.lastUpdateTime = now;
            const currentMetrics = this.getCurrentMetrics();
            // Update metrics history
            this.updateMetricsHistory(currentMetrics);
            // Update status bar items with error handling
            try {
                // Use provided metrics if available, otherwise use current metrics
                const cpuMetrics = metrics?.cpu ?? currentMetrics.cpu;
                const memoryMetrics = metrics?.memory ?? currentMetrics.memory;
                const loadMetrics = metrics?.load ?? currentMetrics.load;
                this.updateMetricDisplay('cpu', this.formatCPUDisplay(cpuMetrics));
                this.updateMetricDisplay('memory', this.formatMemoryDisplay(memoryMetrics));
                this.updateMetricDisplay('load', this.formatLoadDisplay(loadMetrics));
                this.updateMetricDisplay('extensions', this.formatExtensionsDisplay(currentMetrics.extensions));
                this.updateMetricDisplay('editors', this.formatEditorsDisplay(currentMetrics.editors));
                this.updateMetricDisplay('gc', this.formatGCDisplay(metrics?.gcStats));
            }
            catch (error) {
                console.error('Error updating metric displays:', error);
            }
        }
        catch (error) {
            console.error('Error in updateMetrics:', error);
        }
    }
    async processUpdateQueue() {
        if (this.isUpdating || this.updateQueue.length === 0) {
            return;
        }
        this.isUpdating = true;
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            if (update) {
                update();
            }
            await new Promise(resolve => setTimeout(resolve, this.MIN_UPDATE_INTERVAL));
        }
        this.isUpdating = false;
    }
    updateMetricsHistory(metrics) {
        this.metricsHistory.cpu.push(metrics.cpu);
        this.metricsHistory.memory.push(metrics.memory);
        this.metricsHistory.load.push(metrics.load);
        // Keep history size consistent
        if (this.metricsHistory.cpu.length > 10) {
            this.metricsHistory.cpu.shift();
            this.metricsHistory.memory.shift();
            this.metricsHistory.load.shift();
        }
    }
    calculateTrend(values) {
        if (values.length < 2) {
            return 0;
        }
        const first = values[0];
        const last = values[values.length - 1];
        return (last - first) / first;
    }
    updateMetricDisplay(key, display) {
        const item = this.statusBarItems.get(key);
        if (item) {
            item.text = display.text;
            item.tooltip = display.tooltip;
            item.color = display.color;
        }
    }
    formatCPUDisplay(cpu) {
        const trend = this.calculateTrend(this.metricsHistory.cpu);
        const color = this.getTrendColor(trend);
        const icon = cpu > 0.8 ? '$(warning)' : '$(pulse)';
        return {
            text: `${icon} CPU: ${(cpu * 100).toFixed(1)}%`,
            tooltip: `CPU Usage: ${(cpu * 100).toFixed(1)}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }
    formatMemoryDisplay(memory) {
        const trend = this.calculateTrend(this.metricsHistory.memory);
        const color = this.getTrendColor(trend);
        const icon = memory > 0.8 ? '$(warning)' : '$(database)';
        return {
            text: `${icon} MEM: ${(memory * 100).toFixed(1)}%`,
            tooltip: `Memory Usage: ${(memory * 100).toFixed(1)}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }
    formatLoadDisplay(load) {
        const trend = this.calculateTrend(this.metricsHistory.load);
        const color = this.getTrendColor(trend);
        const icon = load > 80 ? '$(warning)' : '$(server)';
        return {
            text: `${icon} LOAD: ${load}%`,
            tooltip: `System Load: ${load}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }
    formatExtensionsDisplay(count) {
        const icon = count > 50 ? '$(warning)' : '$(extensions)';
        return {
            text: `${icon} Ext: ${count}`,
            tooltip: `Active Extensions: ${count}\nClick to manage extensions`,
            color: count > 50 ? '#ffa500' : '#ffffff'
        };
    }
    formatEditorsDisplay(count) {
        const icon = count > 10 ? '$(warning)' : '$(files)';
        return {
            text: `${icon} Editors: ${count}`,
            tooltip: `Active Editors: ${count}\nClick to manage editors`,
            color: count > 10 ? '#ffa500' : '#ffffff'
        };
    }
    formatGCDisplay(gcStats) {
        if (!gcStats) {
            return {
                text: '$(trash) GC: N/A',
                tooltip: 'Garbage Collection stats unavailable',
                color: '#888888'
            };
        }
        const heapUsed = gcStats.heapUsed / 1024 / 1024;
        const heapTotal = gcStats.heapTotal / 1024 / 1024;
        const icon = heapUsed / heapTotal > 0.8 ? '$(warning)' : '$(trash)';
        return {
            text: `${icon} GC: ${heapUsed.toFixed(1)}MB`,
            tooltip: `Heap Used: ${heapUsed.toFixed(1)}MB\nHeap Total: ${heapTotal.toFixed(1)}MB\nLast GC: ${gcStats.lastGC ? new Date(gcStats.lastGC).toLocaleTimeString() : 'N/A'}`,
            color: heapUsed / heapTotal > 0.8 ? '#ffa500' : '#ffffff'
        };
    }
    getTrendDescription(trend) {
        if (trend > 0.1) {
            return '⚠️ Rapidly increasing';
        }
        if (trend > 0.05) {
            return '↗️ Increasing';
        }
        if (trend < -0.1) {
            return '⚠️ Rapidly decreasing';
        }
        if (trend < -0.05) {
            return '↘️ Decreasing';
        }
        return '→ Stable';
    }
    getTrendColor(trend) {
        if (trend > 0.1) {
            return '#ff0000';
        } // Red for significant increase
        if (trend > 0.05) {
            return '#ffa500';
        } // Orange for moderate increase
        if (trend < -0.05) {
            return '#00ff00';
        } // Green for decrease
        return '#ffffff'; // White for stable
    }
    formatTimeAgo(ms) {
        if (ms < 1000) {
            return `${ms}ms ago`;
        }
        if (ms < 60000) {
            return `${Math.floor(ms / 1000)}s ago`;
        }
        return `${Math.floor(ms / 60000)}m ago`;
    }
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(1)} ${units[unitIndex]}`;
    }
    getCurrentMetrics() {
        const usage = process.memoryUsage();
        const loadAvg = os_1.default.loadavg();
        return {
            cpu: this.context.globalState.get('vsblue.lastCPUUsage', 0),
            memory: usage.heapUsed / usage.heapTotal,
            load: Math.round(loadAvg[0] * 100),
            extensions: vscode.extensions.all.length,
            editors: vscode.window.visibleTextEditors.length
        };
    }
    disposeStatusBarItems() {
        this.statusBarItems.forEach(item => item.dispose());
        this.statusBarItems.clear();
    }
    clearMetricsHistory() {
        this.metricsHistory = {
            cpu: [],
            memory: [],
            load: []
        };
    }
    dispose() {
        this.hide();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.MetricsHUD = MetricsHUD;
//# sourceMappingURL=metricsHUD.js.map