export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  loadAverage: number[];
  uptime: number;
  extensionCount: number;
  activeEditors: number;
  memoryHistory: number[];
  cpuHistory: number[];
  heapStats: {
    used: number;
    total: number;
    external: number;
    arrayBuffers: number;
    fragmentation: number;
  };
  gcStats: {
    lastGCTime: number;
    gcCount: number;
    gcDuration: number;
    memoryBeforeGC: number;
    memoryAfterGC: number;
  };
  networkStats: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  loadHistory: number[];
  activeExtensions: number;
}
