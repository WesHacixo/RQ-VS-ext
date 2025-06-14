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
exports.RedcodeManager = void 0;
const vscode = __importStar(require("vscode"));
const enhancedMemoryManager_1 = require("../performance/enhancedMemoryManager");
class RedcodeManager {
    constructor(context) {
        this.originalExtensions = new Map();
        this.isRedcodeActive = false;
        this.disposables = [];
        this.context = context;
        this.memoryManager = new enhancedMemoryManager_1.EnhancedMemoryManager(context);
        this.initialize();
    }
    initialize() {
        // Register commands
        this.disposables.push(vscode.commands.registerCommand('vsblue.toggleRedcode', () => this.toggle()), vscode.commands.registerCommand('vsblue.optimizeWorkspace', () => this.optimizeWorkspace()));
    }
    async toggle() {
        this.isRedcodeActive = !this.isRedcodeActive;
        if (this.isRedcodeActive) {
            await this.enable();
        }
        else {
            await this.disable();
        }
    }
    async enable() {
        try {
            // Store current extension states
            this.originalExtensions.clear();
            vscode.extensions.all.forEach(ext => {
                this.originalExtensions.set(ext.id, ext.isActive);
            });
            // Get workspace extensions
            const workspaceExtensions = await this.getWorkspaceExtensions();
            // Disable non-workspace extensions
            for (const ext of vscode.extensions.all) {
                if (!workspaceExtensions.has(ext.id) &&
                    !ext.id.includes('github.copilot') &&
                    !ext.id.includes('github.copilot-chat')) {
                    await vscode.commands.executeCommand('workbench.extensions.disableExtension', ext.id);
                }
            }
            // Enable Zen Mode
            await vscode.commands.executeCommand('workbench.action.toggleZenMode');
            // Optimize memory
            await this.optimizeMemory();
            // Update performance monitoring settings
            const config = vscode.workspace.getConfiguration('vsblue');
            await config.update('performance.monitoringInterval', 1000, true); // More frequent updates in REDCODE mode
            await config.update('performance.warningThreshold', 90, true); // Higher threshold in REDCODE mode
            this.isRedcodeActive = true;
            vscode.window.showInformationMessage('REDCODE mode activated: Workspace optimized for maximum performance');
        }
        catch (error) {
            console.error('Error enabling REDCODE:', error);
            vscode.window.showErrorMessage('Failed to enable REDCODE mode');
        }
    }
    async disable() {
        try {
            // Restore original extension states
            for (const [id, wasActive] of this.originalExtensions) {
                if (wasActive) {
                    await vscode.commands.executeCommand('workbench.extensions.enableExtension', id);
                }
            }
            // Disable Zen Mode
            await vscode.commands.executeCommand('workbench.action.toggleZenMode');
            // Restore performance monitoring settings
            const config = vscode.workspace.getConfiguration('vsblue');
            await config.update('performance.monitoringInterval', 5000, true); // Normal update interval
            await config.update('performance.warningThreshold', 85, true); // Normal threshold
            this.isRedcodeActive = false;
            vscode.window.showInformationMessage('REDCODE mode deactivated: Normal workspace restored');
        }
        catch (error) {
            console.error('Error disabling REDCODE:', error);
            vscode.window.showErrorMessage('Failed to disable REDCODE mode');
        }
    }
    async getWorkspaceExtensions() {
        const workspaceExtensions = new Set();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const packageJson = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/package.json'));
                for (const file of packageJson) {
                    try {
                        const content = await vscode.workspace.fs.readFile(file);
                        const packageData = JSON.parse(content.toString());
                        // Add dependencies and devDependencies
                        const deps = {
                            ...packageData.dependencies,
                            ...packageData.devDependencies
                        };
                        for (const dep of Object.keys(deps)) {
                            workspaceExtensions.add(dep);
                        }
                    }
                    catch (error) {
                        console.error(`Error reading package.json: ${file.fsPath}`, error);
                    }
                }
            }
        }
        return workspaceExtensions;
    }
    async optimizeMemory() {
        try {
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            // Clear editor history
            await vscode.commands.executeCommand('workbench.action.clearEditorHistory');
            // Clear search history
            await vscode.commands.executeCommand('search.clearSearchHistory');
            // Clear output channels
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor.document.uri.scheme === 'output') {
                    editor.hide();
                }
            });
            // Minimize memory usage
            const config = vscode.workspace.getConfiguration('vsblue');
            await config.update('memory.optimizationLevel', 'high', true);
            await config.update('memory.aggressiveGC', true, true);
            await config.update('memory.clearCacheOnSave', true, true);
            // Trigger memory optimization
            await vscode.commands.executeCommand('vsblue.optimizeMemory');
        }
        catch (error) {
            console.error('Error optimizing memory:', error);
        }
    }
    async optimizeWorkspace() {
        try {
            // Optimize memory
            await this.optimizeMemory();
            // Clear editor history
            await vscode.commands.executeCommand('workbench.action.clearEditorHistory');
            // Clear search history
            await vscode.commands.executeCommand('search.clearSearchHistory');
            // Minimize memory usage
            const config = vscode.workspace.getConfiguration('vsblue');
            await config.update('memory.optimizationLevel', 'high', true);
            await config.update('memory.aggressiveGC', true, true);
            await config.update('memory.clearCacheOnSave', true, true);
            vscode.window.showInformationMessage('Workspace optimized for maximum performance');
        }
        catch (error) {
            console.error('Error optimizing workspace:', error);
            vscode.window.showErrorMessage('Failed to optimize workspace');
        }
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.isRedcodeActive) {
            this.disable();
        }
    }
}
exports.RedcodeManager = RedcodeManager;
//# sourceMappingURL=redcodeManager.js.map