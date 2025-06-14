import * as os from 'os';
import * as vscode from 'vscode';
import { CircularBuffer } from '../utils/CircularBuffer';
import { PerformanceMetrics, HeapStats, NetworkStats } from '../types';

export class MetricsCollector {
    private memoryHistory: CircularBuffer<number>;
    private cpuHistory: CircularBuffer<number>;
    private loadHistory: CircularBuffer<number>;
    private lastCpuUsage: NodeJS.CpuUsage;
    private lastCpuTime: number;

    constructor(private historySize: number = 60) {
        this.memoryHistory = new CircularBuffer<number>(historySize);
        this.cpuHistory = new CircularBuffer<number>(historySize);
        this.loadHistory = new CircularBuffer<number>(historySize);
        this.lastCpuUsage = process.cpuUsage();
        this.lastCpuTime = Date.now();
    }

    public collect(): PerformanceMetrics {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = this.calculateCpuUsage();
        const loadAvg = os.loadavg();

        // Update history
        this.memoryHistory.push(memoryUsage.heapUsed);
        this.cpuHistory.push(cpuUsage);
        this.loadHistory.push(loadAvg[0]);

        const heapStats: HeapStats = {
            used: memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers || 0,
            fragmentation: 1 - (memoryUsage.heapUsed / memoryUsage.heapTotal)
        };

        const networkStats: NetworkStats = {
            bytesIn: 0,  // These would come from network monitoring
            bytesOut: 0, // These would come from network monitoring
            connections: 0
        };

        return {
            cpu: cpuUsage,
            memory: memoryUsage.heapUsed,
            loadAverage: [loadAvg[0], loadAvg[1], loadAvg[2]],
            uptime: process.uptime(),
            extensionCount: vscode.extensions.all.length,
            activeEditors: vscode.window.visibleTextEditors.length,
            heapStats,
            gcStats: {
                lastGCTime: 0,
                gcCount: 0,
                gcDuration: 0,
                memoryBeforeGC: 0,
                memoryAfterGC: 0,
                lastGCDuration: 0,
                gcType: 'none'
            },
            networkStats,
            activeExtensions: vscode.extensions.all.filter(ext => ext.isActive).length,
            memoryHistory: this.memoryHistory.toArray(),
            cpuHistory: this.cpuHistory.toArray()
        };
    }

    public getHistory() {
        return {
            memory: this.memoryHistory.toArray(),
            cpu: this.cpuHistory.toArray(),
            load: this.loadHistory.toArray()
        };
    }

    public clearHistory(): void {
        this.memoryHistory.clear();
        this.cpuHistory.clear();
        this.loadHistory.clear();
    }

    private calculateCpuUsage(): number {
        const now = Date.now();
        const timeDiff = now - this.lastCpuTime;
        
        if (timeDiff < 100) { // Minimum 100ms between CPU measurements
            return this.cpuHistory.getLatest() || 0;
        }

        const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = process.cpuUsage();
        this.lastCpuTime = now;

        // Calculate CPU usage percentage
        const totalCpuTime = currentCpuUsage.user + currentCpuUsage.system;
        const cpuPercent = (totalCpuTime / (timeDiff * 1000)) * 100; // Convert to percentage
        
        return Math.min(100, Math.max(0, cpuPercent)); // Clamp between 0-100%
    }
}
