type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

export const logMessage = (level: LogLevel, message: string, data?: LogData) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };

  // In a real implementation, this would send logs to a backend service
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
};
