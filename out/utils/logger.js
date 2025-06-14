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
exports.Logger = exports.LogLevel = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(context) {
        this.MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
        this.MAX_LOG_FILES = 5;
        this.outputChannel = vscode.window.createOutputChannel('VS Blue');
        this.logFile = path.join(context.globalStoragePath || '', 'vsblue.log');
        this.initializeLogFile();
    }
    static getInstance(context) {
        if (!Logger.instance) {
            Logger.instance = new Logger(context);
        }
        return Logger.instance;
    }
    initializeLogFile() {
        try {
            if (!fs.existsSync(this.logFile)) {
                fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
            }
            this.rotateLogsIfNeeded();
        }
        catch (error) {
            console.error('Failed to initialize log file:', error);
        }
    }
    rotateLogsIfNeeded() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.MAX_LOG_SIZE) {
                    this.rotateLogs();
                }
            }
        }
        catch (error) {
            console.error('Failed to rotate logs:', error);
        }
    }
    rotateLogs() {
        try {
            // Remove oldest log file if it exists
            const oldestLog = `${this.logFile}.${this.MAX_LOG_FILES}`;
            if (fs.existsSync(oldestLog)) {
                fs.unlinkSync(oldestLog);
            }
            // Rotate existing log files
            for (let i = this.MAX_LOG_FILES - 1; i >= 1; i--) {
                const oldLog = `${this.logFile}.${i}`;
                const newLog = `${this.logFile}.${i + 1}`;
                if (fs.existsSync(oldLog)) {
                    fs.renameSync(oldLog, newLog);
                }
            }
            // Rename current log file
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }
        }
        catch (error) {
            console.error('Failed to rotate log files:', error);
        }
    }
    formatMessage(level, message, error) {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
        return `[${timestamp}] [${level}] ${message}${errorDetails}`;
    }
    writeToLog(message) {
        try {
            this.rotateLogsIfNeeded();
            fs.appendFileSync(this.logFile, message + '\n');
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    debug(message, error) {
        const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }
    info(message, error) {
        const formattedMessage = this.formatMessage(LogLevel.INFO, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }
    warning(message, error) {
        const formattedMessage = this.formatMessage(LogLevel.WARNING, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }
    error(message, error) {
        const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }
    showOutput() {
        this.outputChannel.show();
    }
    dispose() {
        this.outputChannel.dispose();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map