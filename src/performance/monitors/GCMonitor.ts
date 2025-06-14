import { GCStats, IGCMonitor } from '../types';

export class GCMonitor implements IGCMonitor {
    private gcCount: number = 0;
    private lastGCTime: number = 0;
    private lastGCDuration: number = 0;
    private memoryBeforeGC: number = 0;
    private memoryAfterGC: number = 0;
    private gcObservers: Array<(stats: GCStats) => void> = [];
    private observer: PerformanceObserver | null = null;
    private isMonitoring: boolean = false;

    constructor() {
        this.setupGCMonitoring();
    }

    public start(): void {
        if (this.isMonitoring || !this.observer) {return;}
        
        try {
            this.observer.observe({ entryTypes: ['gc'] });
            this.isMonitoring = true;
        } catch (error) {
            console.error('Failed to start GC monitoring:', error);
        }
    }

    public stop(): void {
        if (!this.isMonitoring || !this.observer) {return;}
        
        try {
            this.observer.disconnect();
            this.isMonitoring = false;
        } catch (error) {
            console.error('Failed to stop GC monitoring:', error);
        }
    }

    public getStats(): GCStats {
        return {
            lastGCTime: this.lastGCTime,
            gcCount: this.gcCount,
            gcDuration: this.lastGCDuration,
            memoryBeforeGC: this.memoryBeforeGC,
            memoryAfterGC: this.memoryAfterGC,
            lastGCDuration: this.lastGCDuration,
            gcType: this.getGCType()
        };
    }

    public onGCEvent(callback: (stats: GCStats) => void): void {
        this.gcObservers.push(callback);
    }

    private setupGCMonitoring(): void {
        if (typeof PerformanceObserver === 'undefined') {
            console.warn('PerformanceObserver is not available in this environment');
            return;
        }

        this.observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
                this.handleGCEvent(entry as PerformanceEntry & { kind?: number });
            }
        });
    }

    private handleGCEvent(entry: PerformanceEntry & { kind?: number }): void {
        const now = Date.now();
        const duration = entry.duration || 0;
        
        // Update GC stats
        this.gcCount++;
        this.lastGCTime = now;
        this.lastGCDuration = duration;
        this.memoryBeforeGC = this.memoryAfterGC;
        this.memoryAfterGC = process.memoryUsage().heapUsed;
        
        // Notify observers
        const stats = this.getStats();
        for (const observer of this.gcObservers) {
            try {
                observer(stats);
            } catch (error) {
                console.error('Error in GC observer:', error);
            }
        }
    }

    private getGCType(kind?: number): string {
        // Node.js GC types:
        // 1: Scavenge (minor GC)
        // 2: Mark-sweep-compact (major GC)
        // 4: Incremental marking
        // 8: Weak/Phantom callbacks
        // 15: All
        switch (kind) {
            case 1: return 'scavenge';
            case 2: return 'mark-sweep';
            case 4: return 'incremental-marking';
            case 8: return 'weak-callbacks';
            case 15: return 'all';
            default: return 'unknown';
        }
    }
}
