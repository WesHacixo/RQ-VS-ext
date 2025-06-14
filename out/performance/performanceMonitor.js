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
const enhancedMemoryManager_1 = require("./enhancedMemoryManager");
class PerformanceMonitor {
    constructor(context) {
        this.MONITORING_INTERVAL = 5000; // 5 seconds
        this.disposables = [];
        this.memoryManager = new enhancedMemoryManager_1.EnhancedMemoryManager(context);
        this._logger = vscode.window.createOutputChannel('VS Blue Performance');
        this.initializeMetrics();
        this.startMonitoring();
    }
    initializeMetrics() {
        const usage = process.memoryUsage();
        this.metrics = {
            cpu: 0,
            memory: usage.heapUsed / usage.heapTotal,
            loadAverage: os.loadavg(),
            uptime: process.uptime(),
            extensionCount: vscode.extensions.all.length,
            activeEditors: vscode.window.visibleTextEditors.length,
            activeExtensions: vscode.extensions.all.filter(ext => ext.isActive).length,
            memoryHistory: [],
            cpuHistory: [],
            heapStats: {
                used: usage.heapUsed,
                total: usage.heapTotal,
                external: usage.external,
                arrayBuffers: usage.arrayBuffers,
                fragmentation: (usage.heapTotal - usage.heapUsed) / usage.heapTotal
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
            extensionMetrics: new Map(),
            fsMetrics: {
                reads: 0,
                writes: 0,
                lastReset: Date.now()
            },
            indexingMetrics: {
                filesIndexed: 0,
                timeSpent: 0,
                lastIndex: Date.now()
            }
        };
    }
    startMonitoring() {
        if (this.monitoringInterval) {
            return;
        }
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
        }, this.MONITORING_INTERVAL);
        // Monitor file system operations
        this.disposables.push(vscode.workspace.onDidCreateFiles(() => this.metrics.fsMetrics.writes++), vscode.workspace.onDidDeleteFiles(() => this.metrics.fsMetrics.writes++), vscode.workspace.onDidRenameFiles(() => this.metrics.fsMetrics.writes++), vscode.workspace.onDidChangeTextDocument(() => this.metrics.fsMetrics.writes++));
        // Monitor indexing
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.metrics.indexingMetrics.lastIndex = Date.now();
            this.metrics.indexingMetrics.filesIndexed++;
        }));
    }
    async updateMetrics() {
        const stats = process.memoryUsage();
        const cpuUsage = this.calculateCPUUsage();
        const loadAvg = os.loadavg();
        const uptime = os.uptime();
        const extensionCount = vscode.extensions.all.length;
        const activeEditors = vscode.window.visibleTextEditors.length;
        const activeExtensions = vscode.extensions.all.filter(ext => ext.isActive).length;
        // Update history
        this.metrics.cpuHistory.push(cpuUsage);
        this.metrics.memoryHistory.push(stats.heapUsed / stats.heapTotal);
        this.metrics.loadHistory.push(loadAvg[0]);
        // Trim history if too long
        if (this.metrics.cpuHistory.length > 60) {
            this.metrics.cpuHistory.shift();
            this.metrics.memoryHistory.shift();
            this.metrics.loadHistory.shift();
        }
        // Update current metrics
        this.metrics = {
            ...this.metrics,
            cpu: cpuUsage,
            memory: stats.heapUsed / stats.heapTotal,
            loadAverage: loadAvg,
            uptime,
            extensionCount,
            activeEditors,
            activeExtensions,
            heapStats: {
                used: stats.heapUsed,
                total: stats.heapTotal,
                external: stats.external,
                arrayBuffers: stats.arrayBuffers,
                fragmentation: this.calculateFragmentation(stats)
            }
        };
        // Update extension metrics
        await this.updateExtensionMetrics();
        // Check for memory pressure
        await this.memoryManager.handleMemoryPressure();
        // Check for memory leaks
        if (this.detectMemoryLeak()) {
            this.onMemoryLeakDetected();
        }
    }
    async updateExtensionMetrics() {
        const extensions = vscode.extensions.all;
        for (const ext of extensions) {
            if (ext.isActive) {
                const metrics = this.metrics.extensionMetrics.get(ext.id) || {
                    cpu: 0,
                    memory: 0,
                    lastUpdate: Date.now()
                };
                // Update extension metrics
                metrics.cpu = this.calculateExtensionCPU(ext.id);
                metrics.memory = this.calculateExtensionMemory(ext.id);
                metrics.lastUpdate = Date.now();
                this.metrics.extensionMetrics.set(ext.id, metrics);
            }
        }
    }
    calculateCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        return 1 - (totalIdle / totalTick);
    }
    calculateExtensionCPU(extensionId) {
        // This is a simplified calculation
        // In a real implementation, you'd need to use platform-specific APIs
        return Math.random() * 0.1; // Simulated CPU usage
    }
    calculateExtensionMemory(extensionId) {
        // This is a simplified calculation
        // In a real implementation, you'd need to use platform-specific APIs
        return Math.random() * 1024 * 1024; // Simulated memory usage
    }
    calculateFragmentation(stats) {
        return (stats.heapTotal - stats.heapUsed) / stats.heapTotal;
    }
    detectMemoryLeak() {
        if (this.metrics.memoryHistory.length < 10) {
            return false;
        }
        const recentHistory = this.metrics.memoryHistory.slice(-10);
        const growthRate = recentHistory[recentHistory.length - 1] - recentHistory[0];
        const averageGrowth = growthRate / recentHistory.length;
        const fragmentation = this.metrics.heapStats.fragmentation;
        // Check for consistent memory growth
        const isGrowing = averageGrowth > 0.01; // 1% growth per interval
        const isFragmented = fragmentation > 0.3; // 30% fragmentation
        const hasRecentGC = Date.now() - this.metrics.gcStats.lastGCTime < 60000; // GC in last minute
        return isGrowing && !hasRecentGC && isFragmented;
    }
    onMemoryLeakDetected() {
        vscode.window.showWarningMessage('VS Blue: Potential memory leak detected');
    }
    getMetrics() {
        return this.metrics;
    }
    dispose() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this._logger.dispose();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=performanceMonitor.js.map