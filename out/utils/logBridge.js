"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessage = void 0;
const logMessage = (level, message, data) => {
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
exports.logMessage = logMessage;
//# sourceMappingURL=logBridge.js.map