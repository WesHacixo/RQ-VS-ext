
export interface PerformanceMetrics {
    /** CPU usage percentage (0-100) */
    cpu: number;
    /** Memory usage in bytes */
    memory: number;
    /** System load averages (1, 5, 15 minutes) */
    loadAverage: [number, number, number];
    /** System uptime in seconds */
    uptime: number;
    /** Number of installed extensions */
    extensionCount: number;
    /** Number of active text editors */
    activeEditors: number;
    /** Heap memory statistics */
    heapStats: HeapStats;
    /** Garbage collection statistics */
    gcStats: GCStats;
    /** Network statistics */
    networkStats: NetworkStats;
    /** Number of active extensions */
    activeExtensions: number;

    // Legacy metrics for backward compatibility
    /** @deprecated Use cpu instead */
    cpuUsage?: number;
    /** @deprecated Use memory instead */
    memoryUsage?: number;
    /** @deprecated Use uptime instead */
    uptimeSeconds?: number;
    /** @deprecated Use platform specific metrics instead */
    platform?: string;
    /** @deprecated Use gcStats.lastGCTime instead */
    lastGCTime?: number;

    // Extension specific metrics
    extensionMetrics?: {
        cpu: number;
        memory: number;
        lastUpdate: number;
    };

    // File system metrics
    fsMetrics?: {
        reads: number;
        writes: number;
        lastReset: number;
    };

    // Indexing metrics
    indexingMetrics?: {
        filesIndexed: number;
        timeSpent: number;
        lastIndex: number;
    };

    // Memory history for trend analysis
    memoryHistory?: number[];
    cpuHistory?: number[];
    loadHistory?: number[];
}

export interface HeapStats {
    used: number;
    total: number;
    external: number;
    arrayBuffers: number;
    fragmentation: number;
}

export interface GCStats {
    lastGCTime: number;
    gcCount: number;
    gcDuration: number;
    memoryBeforeGC: number;
    memoryAfterGC: number;
    lastGCDuration: number;
    gcType: string;
}

export interface NetworkStats {
    bytesIn: number;
    bytesOut: number;
    connections: number;
}

export interface PerformanceMonitorOptions {
    monitoringInterval?: number;
    historySize?: number;
    warningThreshold?: number;
    emergencyThreshold?: number;
    gcDetectionThreshold?: number;
    optimizationCooldown?: number;
    maxHistorySize?: number;
}

export interface IPerformanceMonitor {
    start(): void;
    stop(): void;
    collectMetrics(): void;
    optimizeMemory(force?: boolean): Promise<void>;
    getMetrics(): PerformanceMetrics | null;
    dispose(): void;
}

export interface IGCMonitor {
    start(): void;
    stop(): void;
    getStats(): GCStats;
    onGCEvent(callback: (stats: GCStats) => void): void;
}

export interface IMetricsCollector {
    collect(): PerformanceMetrics;
    getHistory(): {
        memory: number[];
        cpu: number[];
        load: number[];
    };
    clearHistory(): void;
}

export interface ICacheManager {
    clear(): Promise<void>;
    getSize(): number;
}
