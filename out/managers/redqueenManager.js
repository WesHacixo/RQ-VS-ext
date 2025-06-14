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
exports.RedQueenManager = void 0;
const vscode = __importStar(require("vscode"));
class RedQueenManager {
    constructor() {
        this.disposables = [];
        this.features = this.loadFeatures();
        this.theme = this.loadTheme();
        this.setupConfigurationListener();
    }
    static getInstance() {
        if (!RedQueenManager.instance) {
            RedQueenManager.instance = new RedQueenManager();
        }
        return RedQueenManager.instance;
    }
    loadFeatures() {
        const config = vscode.workspace.getConfiguration('redqueen.features');
        return {
            redcodeMode: config.get('redcodeMode') ?? true,
            memoryEngine: config.get('memoryEngine') ?? false,
            agentConsole: config.get('agentConsole') ?? false,
            canvasMode: config.get('canvasMode') ?? false
        };
    }
    loadTheme() {
        const config = vscode.workspace.getConfiguration('redqueen.theme');
        return {
            mode: config.get('mode') ?? 'bluehand',
            dynamicContrast: config.get('dynamicContrast') ?? true,
            fontOverlay: config.get('fontOverlay') ?? true
        };
    }
    setupConfigurationListener() {
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('redqueen.features')) {
                this.features = this.loadFeatures();
                this.updateUI();
            }
            if (e.affectsConfiguration('redqueen.theme')) {
                this.theme = this.loadTheme();
                this.updateTheme();
            }
        }));
    }
    isFeatureEnabled(feature) {
        return this.features[feature];
    }
    getTheme() {
        return this.theme;
    }
    updateUI() {
        // Update UI components based on feature flags
        vscode.commands.executeCommand('setContext', 'redqueen.redcodeMode', this.features.redcodeMode);
        vscode.commands.executeCommand('setContext', 'redqueen.memoryEngine', this.features.memoryEngine);
        vscode.commands.executeCommand('setContext', 'redqueen.agentConsole', this.features.agentConsole);
        vscode.commands.executeCommand('setContext', 'redqueen.canvasMode', this.features.canvasMode);
    }
    updateTheme() {
        // Apply theme changes
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        if (this.theme.mode === 'redcode') {
            workbenchConfig.update('colorCustomizations', {
                'editor.background': '#1a0000',
                'sideBar.background': '#1a0000',
                'activityBar.background': '#1a0000',
                'statusBar.background': '#1a0000',
                'titleBar.activeBackground': '#1a0000',
                'editor.foreground': '#ff3333',
                'sideBar.foreground': '#ff3333',
                'activityBar.foreground': '#ff3333',
                'statusBar.foreground': '#ff3333',
                'titleBar.activeForeground': '#ff3333'
            }, true);
        }
        else {
            workbenchConfig.update('colorCustomizations', {
                'editor.background': '#0a0a1a',
                'sideBar.background': '#0a0a1a',
                'activityBar.background': '#0a0a1a',
                'statusBar.background': '#0a0a1a',
                'titleBar.activeBackground': '#0a0a1a',
                'editor.foreground': '#aaccff',
                'sideBar.foreground': '#aaccff',
                'activityBar.foreground': '#aaccff',
                'statusBar.foreground': '#aaccff',
                'titleBar.activeForeground': '#aaccff'
            }, true);
        }
        // Apply font overlay if enabled
        if (this.theme.fontOverlay) {
            workbenchConfig.update('fontFamily', 'JetBrains Mono, Menlo, Monaco, Consolas, monospace', true);
        }
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.RedQueenManager = RedQueenManager;
//# sourceMappingURL=redqueenManager.js.map