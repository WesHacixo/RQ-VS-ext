import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logFile: string;
    private readonly MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
    private readonly MAX_LOG_FILES = 5;

    private constructor(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('VS Blue');
        this.logFile = path.join(context.globalStoragePath || '', 'vsblue.log');
        this.initializeLogFile();
    }

    public static getInstance(context: vscode.ExtensionContext): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(context);
        }
        return Logger.instance;
    }

    private initializeLogFile(): void {
        try {
            if (!fs.existsSync(this.logFile)) {
                fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
            }
            this.rotateLogsIfNeeded();
        } catch (error) {
            console.error('Failed to initialize log file:', error);
        }
    }

    private rotateLogsIfNeeded(): void {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.MAX_LOG_SIZE) {
                    this.rotateLogs();
                }
            }
        } catch (error) {
            console.error('Failed to rotate logs:', error);
        }
    }

    private rotateLogs(): void {
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
        } catch (error) {
            console.error('Failed to rotate log files:', error);
        }
    }

    private formatMessage(level: LogLevel, message: string, error?: Error): string {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
        return `[${timestamp}] [${level}] ${message}${errorDetails}`;
    }

    private writeToLog(message: string): void {
        try {
            this.rotateLogsIfNeeded();
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public debug(message: string, error?: Error): void {
        const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }

    public info(message: string, error?: Error): void {
        const formattedMessage = this.formatMessage(LogLevel.INFO, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }

    public warning(message: string, error?: Error): void {
        const formattedMessage = this.formatMessage(LogLevel.WARNING, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }

    public error(message: string, error?: Error): void {
        const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
        this.outputChannel.appendLine(formattedMessage);
        this.writeToLog(formattedMessage);
    }

    public showOutput(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
