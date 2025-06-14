import os from 'os';
import * as vscode from 'vscode';

interface MetricDisplay {
    text: string;
    tooltip: string;
    color: string;
}

export class MetricsHUD {
    private context: vscode.ExtensionContext;
    private isVisible: boolean = false;
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private updateInterval?: NodeJS.Timeout;
    private readonly UPDATE_INTERVAL = 2000; // Update every 2 seconds
    private readonly MAX_HISTORY = 100; // Maximum number of historical values to keep
    private metricsHistory: {
        cpu: number[];
        memory: number[];
        load: number[];
    } = {
        cpu: [],
        memory: [],
        load: []
    };
    private disposables: vscode.Disposable[] = [];
    private lastUpdateTime: number = 0;
    private readonly MIN_UPDATE_INTERVAL = 1000; // Minimum time between updates (ms)
    private updateQueue: (() => void)[] = [];
    private isUpdating: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initializeMetricsHistory();
    }

    private initializeMetricsHistory(): void {
        const historySize = 10;
        this.metricsHistory = {
            cpu: new Array(historySize).fill(0),
            memory: new Array(historySize).fill(0),
            load: new Array(historySize).fill(0)
        };
    }

    public show(): void {
        if (this.isVisible) { return; }

        try {
            this.isVisible = true;
            this.createStatusBarItems();
            this.startUpdates();
            this.updateMetrics();
        } catch (error) {
            console.error('Error showing HUD:', error);
            this.isVisible = false;
            this.hide();
        }
    }

    public hide(): void {
        if (!this.isVisible) { return; }

        try {
            this.isVisible = false;
            this.stopUpdates();
            this.disposeStatusBarItems();
            this.clearMetricsHistory();
        } catch (error) {
            console.error('Error hiding HUD:', error);
        }
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    private createStatusBarItems(): void {
        // CPU Usage
        const cpuItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        cpuItem.command = 'vsblue.showPerformanceDetails';
        cpuItem.show();
        this.statusBarItems.set('cpu', cpuItem);

        // Memory Usage
        const memoryItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        memoryItem.command = 'vsblue.showMemoryDetails';
        memoryItem.show();
        this.statusBarItems.set('memory', memoryItem);

        // Load Average
        const loadItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            98
        );
        loadItem.command = 'vsblue.showSystemDetails';
        loadItem.show();
        this.statusBarItems.set('load', loadItem);

        // Active Extensions
        const extensionsItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            97
        );
        extensionsItem.command = 'vsblue.showExtensionDetails';
        extensionsItem.show();
        this.statusBarItems.set('extensions', extensionsItem);

        // Active Editors
        const editorsItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            96
        );
        editorsItem.command = 'vsblue.showEditorDetails';
        editorsItem.show();
        this.statusBarItems.set('editors', editorsItem);

        // GC Status
        const gcItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            95
        );
        gcItem.command = 'vsblue.showGCDetails';
        gcItem.show();
        this.statusBarItems.set('gc', gcItem);
    }

    private startUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateMetrics(), this.UPDATE_INTERVAL);
    }

    private stopUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
    }

    public updateMetrics(metrics?: any): void {
        if (!this.isVisible) { return; }

        try {
            const now = Date.now();
            if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
                this.updateQueue.push(() => this.updateMetrics(metrics));
                if (!this.isUpdating) { this.processUpdateQueue(); }
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
            } catch (error) {
                console.error('Error updating metric displays:', error);
            }
        } catch (error) {
            console.error('Error in updateMetrics:', error);
        }
    }

    private async processUpdateQueue(): Promise<void> {
        if (this.isUpdating || this.updateQueue.length === 0) { return; }

        this.isUpdating = true;
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            if (update) { update(); }
            await new Promise(resolve => setTimeout(resolve, this.MIN_UPDATE_INTERVAL));
        }
        this.isUpdating = false;
    }

    private updateMetricsHistory(metrics: any): void {
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

    private calculateTrend(values: number[]): number {
        if (values.length < 2) { return 0; }
        const first = values[0];
        const last = values[values.length - 1];
        return (last - first) / first;
    }

    private updateMetricDisplay(key: string, display: MetricDisplay): void {
        const item = this.statusBarItems.get(key);
        if (item) {
            item.text = display.text;
            item.tooltip = display.tooltip;
            item.color = display.color;
        }
    }

    private formatCPUDisplay(cpu: number): MetricDisplay {
        const trend = this.calculateTrend(this.metricsHistory.cpu);
        const color = this.getTrendColor(trend);
        const icon = cpu > 0.8 ? '$(warning)' : '$(pulse)';
        return {
            text: `${icon} CPU: ${(cpu * 100).toFixed(1)}%`,
            tooltip: `CPU Usage: ${(cpu * 100).toFixed(1)}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }

    private formatMemoryDisplay(memory: number): MetricDisplay {
        const trend = this.calculateTrend(this.metricsHistory.memory);
        const color = this.getTrendColor(trend);
        const icon = memory > 0.8 ? '$(warning)' : '$(database)';
        return {
            text: `${icon} MEM: ${(memory * 100).toFixed(1)}%`,
            tooltip: `Memory Usage: ${(memory * 100).toFixed(1)}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }

    private formatLoadDisplay(load: number): MetricDisplay {
        const trend = this.calculateTrend(this.metricsHistory.load);
        const color = this.getTrendColor(trend);
        const icon = load > 80 ? '$(warning)' : '$(server)';
        return {
            text: `${icon} LOAD: ${load}%`,
            tooltip: `System Load: ${load}%\nTrend: ${(trend * 100).toFixed(1)}%\n${this.getTrendDescription(trend)}`,
            color: color
        };
    }

    private formatExtensionsDisplay(count: number): MetricDisplay {
        const icon = count > 50 ? '$(warning)' : '$(extensions)';
        return {
            text: `${icon} Ext: ${count}`,
            tooltip: `Active Extensions: ${count}\nClick to manage extensions`,
            color: count > 50 ? '#ffa500' : '#ffffff'
        };
    }

    private formatEditorsDisplay(count: number): MetricDisplay {
        const icon = count > 10 ? '$(warning)' : '$(files)';
        return {
            text: `${icon} Editors: ${count}`,
            tooltip: `Active Editors: ${count}\nClick to manage editors`,
            color: count > 10 ? '#ffa500' : '#ffffff'
        };
    }

    private formatGCDisplay(gcStats?: any): MetricDisplay {
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

    private getTrendDescription(trend: number): string {
        if (trend > 0.1) {return '⚠️ Rapidly increasing';}
        if (trend > 0.05) {return '↗️ Increasing';}
        if (trend < -0.1) {return '⚠️ Rapidly decreasing';}
        if (trend < -0.05) {return '↘️ Decreasing';}
        return '→ Stable';
    }

    private getTrendColor(trend: number): string {
        if (trend > 0.1) { return '#ff0000'; } // Red for significant increase
        if (trend > 0.05) { return '#ffa500'; } // Orange for moderate increase
        if (trend < -0.05) { return '#00ff00'; } // Green for decrease
        return '#ffffff'; // White for stable
    }

    private formatTimeAgo(ms: number): string {
        if (ms < 1000) { return `${ms}ms ago`; }
        if (ms < 60000) { return `${Math.floor(ms / 1000)}s ago`; }
        return `${Math.floor(ms / 60000)}m ago`;
    }

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(1)} ${units[unitIndex]}`;
    }

    private getCurrentMetrics(): { cpu: number; memory: number; load: number; extensions: number; editors: number } {
        const usage = process.memoryUsage();
        const loadAvg = os.loadavg();

        return {
            cpu: this.context.globalState.get('vsblue.lastCPUUsage', 0),
            memory: usage.heapUsed / usage.heapTotal,
            load: Math.round(loadAvg[0] * 100),
            extensions: vscode.extensions.all.length,
            editors: vscode.window.visibleTextEditors.length
        };
    }

    private disposeStatusBarItems(): void {
        this.statusBarItems.forEach(item => item.dispose());
        this.statusBarItems.clear();
    }

    private clearMetricsHistory(): void {
        this.metricsHistory = {
            cpu: [],
            memory: [],
            load: []
        };
    }

    public dispose(): void {
        this.hide();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
