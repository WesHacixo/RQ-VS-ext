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
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
class ErrorHandler {
    constructor(context, logger) {
        this.errorCount = new Map();
        this.MAX_ERRORS = 3;
        this.ERROR_RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.context = context;
        this.logger = logger;
        this.startErrorResetInterval();
    }
    startErrorResetInterval() {
        setInterval(() => {
            this.errorCount.clear();
        }, this.ERROR_RESET_INTERVAL);
    }
    handleError(error, context, showNotification = true) {
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
    showErrorNotification(error, context) {
        const message = `VS Blue: Error in ${context}`;
        const actions = ['Show Details', 'Restart Extension'];
        vscode.window.showErrorMessage(message, ...actions).then(selection => {
            if (selection === 'Show Details') {
                this.logger.showOutput();
            }
            else if (selection === 'Restart Extension') {
                vscode.commands.executeCommand('vsblue.restart');
            }
        });
    }
    suggestRestart(context) {
        const message = `VS Blue: Multiple errors in ${context}. Would you like to restart the extension?`;
        vscode.window.showWarningMessage(message, 'Restart', 'Ignore').then(selection => {
            if (selection === 'Restart') {
                vscode.commands.executeCommand('vsblue.restart');
            }
        });
    }
    handleWarning(message, context) {
        this.logger.warning(`Warning in ${context}: ${message}`);
        vscode.window.showWarningMessage(`VS Blue: ${message}`);
    }
    handleInfo(message, context) {
        this.logger.info(`Info in ${context}: ${message}`);
    }
    handleDebug(message, context) {
        this.logger.debug(`Debug in ${context}: ${message}`);
    }
    dispose() {
        this.errorCount.clear();
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map