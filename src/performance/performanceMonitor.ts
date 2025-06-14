import * as vscode from 'vscode';
import { MetricsCollector } from './collectors/MetricsCollector';
import { EnhancedMemoryManager } from './enhancedMemoryManager';
import { CacheManager } from './managers/CacheManager';
import { GCMonitor } from './monitors/GCMonitor';
import { GCStats, PerformanceMetrics } from './types';

// These interfaces are now part of PerformanceMetrics in types.ts
// and are kept here only for backward compatibility during migration
type ExtensionMetrics = { cpu: number; memory: number; lastUpdate: number; };
type FSMetrics = PerformanceMetrics['fsMetrics'];
type IndexingMetrics = PerformanceMetrics['indexingMetrics'];

/**
 * Main PerformanceMonitor class that coordinates monitoring of VS Code performance
 */
export class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        cpu: 0,
        memory: 0,
        loadAverage: [0, 0, 0],
        uptime: 0,
        extensionCount: 0,
        activeEditors: 0,
        activeExtensions: 0,
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
            memoryAfterGC: 0,
            lastGCDuration: 0,
            gcType: 'unknown'
        },
        networkStats: {
            bytesIn: 0,
            bytesOut: 0,
            connections: 0
        },
        // Legacy metrics
        cpuUsage: 0,
        memoryUsage: 0,
        uptimeSeconds: 0,
        platform: process.platform,
        lastGCTime: 0,
        // Initialize metrics
        extensionMetrics: {
            cpu: 0,
            memory: 0,
            lastUpdate: 0
        },
        fsMetrics: {
            reads: 0,
            writes: 0,
            lastReset: Date.now()
        },
        indexingMetrics: {
            filesIndexed: 0,
            timeSpent: 0,
            lastIndex: 0
        },
        memoryHistory: []
    };
    private readonly MONITORING_INTERVAL = 5000; // 5 seconds
    private monitoringInterval?: NodeJS.Timeout;
    private disposables: vscode.Disposable[] = [];
    private memoryManager: EnhancedMemoryManager;
    private _logger: vscode.OutputChannel;

    // New components
    private gcMonitor: GCMonitor;
    private metricsCollector: MetricsCollector;
    private cacheManager: CacheManager;
    private lastOptimizationTime: number = 0;
    private optimizationCooldown: number = 30000; // 30 seconds

    constructor(context: vscode.ExtensionContext) {
        this._logger = vscode.window.createOutputChannel('VS Blue Performance');
        this.memoryManager = new EnhancedMemoryManager(context);

        // Initialize new components
        this.gcMonitor = new GCMonitor();
        this.metricsCollector = new MetricsCollector(60); // Keep 60 data points (5 minutes at 5s intervals)
        this.cacheManager = new CacheManager();

        // Set up GC monitoring
        this.setupGCMonitoring();

        // Initialize metrics with current system state
        this.initializeMetrics();

        // Initialize legacy metrics
        this.metrics.cpuUsage = this.metrics.cpu;
        this.metrics.memoryUsage = this.metrics.memory;
        this.metrics.uptimeSeconds = this.metrics.uptime;
        this.metrics.platform = process.platform;

        // Start monitoring
        this.startMonitoring();
    }

    private setupGCMonitoring(): void {
        this.gcMonitor.onGCEvent((stats: GCStats) => {
            // Update metrics with GC stats
            if (this.metrics) {
                this.metrics.gcStats = {
                    ...this.metrics.gcStats,
                    ...stats
                };
            }

            // Check for memory leaks after GC
            this.checkForMemoryLeaks();
        });

        this.gcMonitor.start();
    }

    private initializeMetrics(): void {
        // Get initial metrics from collector
        const initialMetrics = this.metricsCollector.collect();

        // Initialize with default values
        this.metrics = {
            ...initialMetrics,
            extensionMetrics: {
                cpu: 0,
                memory: 0,
                lastUpdate: Date.now()
            },
            fsMetrics: {
                reads: 0,
                writes: 0,
                lastReset: Date.now()
            },
            indexingMetrics: {
                filesIndexed: 0,
                timeSpent: 0,
                lastIndex: 0
            }
        };
    }

    private checkForMemoryLeaks(): void {
        if (!this.metrics) {return;}

        const { gcStats, heapStats } = this.metrics;
        const now = Date.now();

        // Check for memory that's not being collected
        if (gcStats.lastGCTime > 0 &&
            now - gcStats.lastGCTime < 10000 && // GC happened in last 10s
            heapStats.used > heapStats.total * 0.8) { // High memory usage

            this._logger.appendLine(`Potential memory leak detected: ${(heapStats.used / 1024 / 1024).toFixed(2)}MB used`);
            this.optimizeMemory();
        }
    }

    public async optimizeMemory(force: boolean = false): Promise<void> {
        const now = Date.now();

        // Respect cooldown unless forced
        if (!force && now - this.lastOptimizationTime < this.optimizationCooldown) {
            return;
        }

        try {
            this._logger.appendLine('Optimizing memory...');

            // Clear caches
            await this.cacheManager.clear();

            // Run GC if available
            if (typeof global.gc === 'function') {
                global.gc();
            }

            this.lastOptimizationTime = now;
            this._logger.appendLine('Memory optimization completed');
        } catch (error) {
            this._logger.appendLine(`Error optimizing memory: ${error}`);
        }
    }

    private collectMetrics(): void {
        try {
            // Get metrics from collector
            const collectedMetrics = this.metricsCollector.collect();

            // Update metrics with collected data
            this.metrics = {
                ...this.metrics,
                ...collectedMetrics,
                // Preserve existing object structures
                extensionMetrics: this.metrics?.extensionMetrics || {
                    cpu: 0,
                    memory: 0,
                    lastUpdate: Date.now()
                },
                fsMetrics: this.metrics?.fsMetrics || { reads: 0, writes: 0, lastReset: Date.now() },
                indexingMetrics: this.metrics?.indexingMetrics || { filesIndexed: 0, timeSpent: 0, lastIndex: 0 }
            };

            // Check if we need to optimize memory
            if (this.metrics.heapStats.used / this.metrics.heapStats.total > 0.8) {
                this.optimizeMemory();
            }
        } catch (error) {
            this._logger.appendLine(`Error collecting metrics: ${error}`);
        }
    }

    private startMonitoring(): void {
        // Stop any existing monitoring
        this.stopMonitoring();

        // Start collecting metrics at regular intervals
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, this.MONITORING_INTERVAL);

        // Log monitoring start
        this._logger.appendLine('Performance monitoring started');
    }

    private stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public dispose(): void {
        // Stop monitoring
        this.stopMonitoring();

        // Stop GC monitoring
        this.gcMonitor.stop();

        // Clear disposables
        for (const disposable of this.disposables) {
            try {
                disposable.dispose();
            } catch (error) {
                this._logger.appendLine(`Error disposing: ${error}`);
            }
        }
        this.disposables = [];

        // Clear any remaining resources
        this.metricsCollector.clearHistory();

        this._logger.appendLine('Performance monitor disposed');
        this._logger.dispose();
    }

    private calculateExtensionCPU(extensionId: string): number {
        // Simple implementation - in a real scenario, you'd track CPU per extension
        return Math.random() * 5; // 0-5% CPU usage
    }

    private calculateExtensionMemory(extensionId: string): number {
        // Simple implementation - in a real scenario, you'd track memory per extension
        return Math.random() * 100 * 1024 * 1024; // 0-100MB
    }

    private calculateFragmentation(stats: NodeJS.MemoryUsage): number {
        // Simple fragmentation calculation
        return (1 - (stats.heapUsed / stats.heapTotal)) * 100; // Percentage of free memory
    }

    private detectMemoryLeak(): boolean {
        // Simple memory leak detection without using non-existent method
        if (!this.metrics || !this.metrics.memoryHistory) {return false;}

        const recentMemory = this.metrics.memoryHistory;
        if (recentMemory.length < 5) {return false;}

        // Check if memory is consistently increasing
        let increasingCount = 0;
        for (let i = 1; i < recentMemory.length; i++) {
            if (recentMemory[i] > recentMemory[i - 1]) {
                increasingCount++;
            }
        }

        return increasingCount >= 3; // If memory increased in 3 out of last 5 measurements
    }

    private onMemoryLeakDetected(): void {
        this._logger.appendLine('Potential memory leak detected!');
        this.optimizeMemory().catch(err => {
            this._logger.appendLine(`Error during memory optimization: ${err}`);
        });
    }
}
