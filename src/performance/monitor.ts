import * as os from 'os';
import * as process from 'process';

/**
 * Performance metrics collected by the monitor
 */
export interface PerformanceMetrics {
  /** CPU usage as a percentage (0-1) */
  cpuUsage: number;
  /** Used heap memory in MB */
  memoryUsageMB: number;
  /** Total system memory in MB */
  memoryTotalMB: number;
  /** System load averages (1min, 5min, 15min) */
  loadAverage: [number, number, number];
  /** System uptime in seconds */
  uptimeSeconds: number;
  /** Platform identifier (e.g., 'darwin', 'linux', 'win32') */
  platform: string;
  /** Timestamp when metrics were collected (epoch ms) */
  timestamp: number;
}

/**
 * Converts bytes to megabytes with 2 decimal places
 */
function toMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

/**
 * Calculates current CPU usage as a percentage (0-1)
 */
function getCpuUsage(): number {
  // Simple implementation using load average
  // More accurate implementations might use process.cpuUsage() over time
  const load = os.loadavg()[0]; // 1-minute load average
  const cores = os.cpus().length;
  return Math.min(1, load / cores); // Cap at 100%
}

/**
 * Gets a snapshot of current performance metrics
 */
export function getMetrics(): PerformanceMetrics {
  const memoryUsage = process.memoryUsage();
  
  return {
    cpuUsage: getCpuUsage(),
    memoryUsageMB: toMB(memoryUsage.heapUsed),
    memoryTotalMB: toMB(os.totalmem()),
    loadAverage: os.loadavg() as [number, number, number],
    uptimeSeconds: os.uptime(),
    platform: os.platform(),
    timestamp: Date.now()
  };
}

/**
 * Watches for performance metrics changes and invokes the callback at the specified interval
 * @param callback Function to call with updated metrics
 * @param intervalMs Interval between updates in milliseconds (default: 5000)
 * @returns Function to stop watching
 */
export function watch(
  callback: (metrics: PerformanceMetrics) => void,
  intervalMs: number = 5000
): () => void {
  // Initial callback with current metrics
  callback(getMetrics());
  
  // Set up interval for updates
  const intervalId = setInterval(() => {
    callback(getMetrics());
  }, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}

// For backward compatibility with existing code
export default {
  getMetrics,
  watch
};
