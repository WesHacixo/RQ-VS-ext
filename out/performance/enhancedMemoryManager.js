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
exports.EnhancedMemoryManager = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class EnhancedMemoryManager {
    constructor(context) {
        this.context = context;
        this.MEMORY_PRESSURE_LEVELS = {
            CRITICAL: 0.9, // 90%
            HIGH: 0.8, // 80%
            MODERATE: 0.7 // 70%
        };
        this.HIGH_IMPACT_EXTENSIONS = [
            'ms-python.python',
            'ms-vscode.vscode-typescript-tslint-plugin',
            'dbaeumer.vscode-eslint',
            'ms-azuretools.vscode-docker',
            'ms-vscode.vscode-typescript-next',
            'ms-vscode.powershell',
            'ms-vscode.cpptools',
            'ms-vscode.go',
            'ms-vscode.vscode-java-pack'
        ];
        this._lastCleanupTime = 0;
        this.CLEANUP_INTERVAL = 60 * 1000; // 1 minute
        this._isOptimizing = false;
        this._extensionHistory = [];
    }
    async handleMemoryPressure() {
        if (this._isOptimizing) {
            return;
        }
        const memoryUsage = process.memoryUsage();
        const heapUsedRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
        this._isOptimizing = true;
        try {
            if (heapUsedRatio > this.MEMORY_PRESSURE_LEVELS.CRITICAL) {
                await this._handleCriticalPressure();
            }
            else if (heapUsedRatio > this.MEMORY_PRESSURE_LEVELS.HIGH) {
                await this._handleHighPressure();
            }
            else if (heapUsedRatio > this.MEMORY_PRESSURE_LEVELS.MODERATE) {
                await this._handleModeratePressure();
            }
        }
        finally {
            this._isOptimizing = false;
        }
    }
    async _handleCriticalPressure() {
        vscode.window.showWarningMessage('VS Blue: Critical memory pressure detected. Enabling REDCODE mode.');
        // Force REDCODE mode optimizations
        await this._clearAllCaches();
        await this._disableNonEssentialFeatures();
        await this._optimizeExtensions(true);
        await this._optimizeWorkspaceSettings(true);
        // Force garbage collection
        if (global.gc) {
            global.gc();
        }
    }
    async _handleHighPressure() {
        vscode.window.showInformationMessage('VS Blue: High memory pressure detected. Running optimizations.');
        await this._clearOldCaches();
        await this._optimizeExtensions(false);
        await this._optimizeWorkspaceSettings(false);
    }
    async _handleModeratePressure() {
        await this._cleanupCache();
    }
    async _clearAllCaches() {
        // Clear extension caches
        const extensionCachePath = path.join(os.homedir(), '.vscode', 'extensions');
        if (fs.existsSync(extensionCachePath)) {
            const cacheFiles = fs.readdirSync(extensionCachePath)
                .filter(file => file.endsWith('.cache'));
            for (const file of cacheFiles) {
                fs.unlinkSync(path.join(extensionCachePath, file));
            }
        }
        // Clear workspace caches
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const cachePath = path.join(folder.uri.fsPath, '.vscode', '.cache');
                if (fs.existsSync(cachePath)) {
                    fs.rmSync(cachePath, { recursive: true, force: true });
                }
            }
        }
        // Clear editor history
        await vscode.commands.executeCommand('workbench.action.clearEditorHistory');
        // Clear search history
        await vscode.commands.executeCommand('search.clearSearchHistory');
    }
    async _clearOldCaches() {
        const now = Date.now();
        if (now - this._lastCleanupTime < this.CLEANUP_INTERVAL) {
            return;
        }
        this._lastCleanupTime = now;
        await this._clearAllCaches();
    }
    async _cleanupCache() {
        try {
            // Clear editor history
            // await vscode.commands.executeCommand('workbench.action.clearEditorHistory'); // Removed to prevent continuous popup
            // Clear extension history
            // await this._clearExtensionHistory(); // Removed to prevent continuous notifications
            // Clear search history
            await vscode.commands.executeCommand('search.action.clearHistory');
            // Clear recent files
            await vscode.commands.executeCommand('workbench.action.clearRecentFiles');
            // Clear output channels
            await vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            await vscode.commands.executeCommand('workbench.action.closePanel');
            // Clear terminal
            await vscode.commands.executeCommand('workbench.action.terminal.clear');
            // Clear debug console
            await vscode.commands.executeCommand('workbench.debug.action.toggleRepl');
            await vscode.commands.executeCommand('workbench.action.closePanel');
            // Clear problems
            await vscode.commands.executeCommand('workbench.actions.view.problems');
            await vscode.commands.executeCommand('workbench.action.closePanel');
            // Clear notifications
            await vscode.commands.executeCommand('notifications.clearAll');
            // Clear extension host logs
            await vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            await vscode.commands.executeCommand('workbench.action.closePanel');
            // Clear extension host
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
        catch (error) {
            console.error('Error cleaning cache:', error);
        }
    }
    async _optimizeExtensions(aggressive) {
        const extensions = vscode.extensions.all;
        const unusedExtensions = await this._findUnusedExtensions();
        // Group extensions by impact
        const highImpactExtensions = extensions.filter(ext => this.HIGH_IMPACT_EXTENSIONS.includes(ext.id));
        if (aggressive) {
            // In aggressive mode, disable all unused extensions
            for (const ext of unusedExtensions) {
                await vscode.commands.executeCommand('workbench.extensions.disableExtension', ext.id);
            }
        }
        else {
            // In normal mode, only disable unused high-impact extensions
            for (const ext of unusedExtensions) {
                if (highImpactExtensions.includes(ext)) {
                    await vscode.commands.executeCommand('workbench.extensions.disableExtension', ext.id);
                }
            }
        }
    }
    async _findUnusedExtensions() {
        const extensions = vscode.extensions.all;
        const unusedExtensions = [];
        const lastUsedThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
        for (const ext of extensions) {
            if (!ext.isActive) {
                const lastUsed = await this._getExtensionLastUsed(ext.id);
                if (lastUsed && Date.now() - lastUsed > lastUsedThreshold) {
                    unusedExtensions.push(ext);
                }
            }
        }
        return unusedExtensions;
    }
    async _getExtensionLastUsed(extensionId) {
        const lastUsed = this.context.globalState.get(`extension.${extensionId}.lastUsed`);
        return lastUsed;
    }
    async _optimizeWorkspaceSettings(aggressive) {
        const config = vscode.workspace.getConfiguration();
        // Optimize file watching
        await config.update('files.watcherExclude', {
            '**/.git/objects/**': true,
            '**/.git/subtree-cache/**': true,
            '**/node_modules/**': true,
            '**/.hg/store/**': true,
            '**/dist/**': true,
            '**/build/**': true,
            '**/.next/**': true,
            '**/.cache/**': true
        }, vscode.ConfigurationTarget.Workspace);
        if (aggressive) {
            // Aggressive optimizations
            await config.update('editor.minimap.enabled', false);
            await config.update('editor.smoothScrolling', false);
            await config.update('workbench.list.smoothScrolling', false);
            await config.update('editor.quickSuggestions', false);
            await config.update('editor.suggest.showMethods', false);
            await config.update('editor.suggest.showFunctions', false);
            await config.update('editor.suggest.showClasses', false);
            await config.update('editor.suggest.showVariables', false);
            await config.update('editor.suggest.showProperties', false);
            await config.update('editor.suggest.showWords', false);
            await config.update('editor.suggest.showColors', false);
            await config.update('editor.suggest.showFiles', false);
            await config.update('editor.suggest.showFolders', false);
            await config.update('editor.suggest.showTypeParameters', false);
            await config.update('editor.suggest.showConstants', false);
            await config.update('editor.suggest.showEnums', false);
            await config.update('editor.suggest.showEnumMembers', false);
            await config.update('editor.suggest.showConstructors', false);
            await config.update('editor.suggest.showDeprecated', false);
            await config.update('editor.suggest.showValues', false);
            await config.update('editor.suggest.showUnits', false);
            await config.update('editor.suggest.showUsers', false);
            await config.update('editor.suggest.showIssues', false);
        }
        else {
            // Normal optimizations
            await config.update('editor.minimap.enabled', false);
            await config.update('editor.smoothScrolling', false);
            await config.update('workbench.list.smoothScrolling', false);
        }
        // Optimize search settings
        await config.update('search.exclude', {
            '**/node_modules': true,
            '**/bower_components': true,
            '**/*.code-search': true
        });
    }
    async _disableNonEssentialFeatures() {
        const config = vscode.workspace.getConfiguration();
        // Disable auto-save
        await config.update('files.autoSave', 'off');
        // Disable format on save
        await config.update('editor.formatOnSave', false);
        // Disable auto-updates
        await config.update('update.mode', 'none');
        // Disable telemetry
        await config.update('telemetry.enableCrashReporter', false);
        await config.update('telemetry.enableTelemetry', false);
    }
}
exports.EnhancedMemoryManager = EnhancedMemoryManager;
//# sourceMappingURL=enhancedMemoryManager.js.map