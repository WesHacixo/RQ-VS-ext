import * as vscode from 'vscode';
import { Logger } from './logger';

export class ErrorHandler {
    private logger: Logger;
    private errorCount: Map<string, number> = new Map();
    private readonly MAX_ERRORS = 3;
    private readonly ERROR_RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, logger: Logger) {
        this.context = context;
        this.logger = logger;
        this.startErrorResetInterval();
    }

    private startErrorResetInterval(): void {
        setInterval(() => {
            this.errorCount.clear();
        }, this.ERROR_RESET_INTERVAL);
    }

    public handleError(error: Error, context: string, showNotification: boolean = true): void {
        const errorKey = `${context}:${error.message}`;
        const count = (this.errorCount.get(errorKey) || 0) + 1;
        this.errorCount.set(errorKey, count);

        // Log the error
        this.logger.error(`Error in ${context}: ${error.message}`, error);

        // Show notification if needed and not too frequent
        if (showNotification && count <= this.MAX_ERRORS) {
            this.showErrorNotification(error, context);
        }

        // If too many errors, suggest restart
        if (count > this.MAX_ERRORS) {
            this.suggestRestart(context);
        }
    }

    private showErrorNotification(error: Error, context: string): void {
        const message = `VS Blue: Error in ${context}`;
        const actions = ['Show Details', 'Restart Extension'];

        vscode.window.showErrorMessage(message, ...actions).then(selection => {
            if (selection === 'Show Details') {
                this.logger.showOutput();
            } else if (selection === 'Restart Extension') {
                vscode.commands.executeCommand('vsblue.restart');
            }
        });
    }

    private suggestRestart(context: string): void {
        const message = `VS Blue: Multiple errors in ${context}. Would you like to restart the extension?`;
        vscode.window.showWarningMessage(message, 'Restart', 'Ignore').then(selection => {
            if (selection === 'Restart') {
                vscode.commands.executeCommand('vsblue.restart');
            }
        });
    }

    public handleWarning(message: string, context: string): void {
        this.logger.warning(`Warning in ${context}: ${message}`);
        vscode.window.showWarningMessage(`VS Blue: ${message}`);
    }

    public handleInfo(message: string, context: string): void {
        this.logger.info(`Info in ${context}: ${message}`);
    }

    public handleDebug(message: string, context: string): void {
        this.logger.debug(`Debug in ${context}: ${message}`);
    }

    public dispose(): void {
        this.errorCount.clear();
    }
}
