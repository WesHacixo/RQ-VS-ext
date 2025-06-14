import * as vscode from 'vscode';

interface RedQueenFeatures {
    redcodeMode: boolean;
    memoryEngine: boolean;
    agentConsole: boolean;
    canvasMode: boolean;
}

interface RedQueenTheme {
    mode: 'bluehand' | 'redcode';
    dynamicContrast: boolean;
    fontOverlay: boolean;
}

export class RedQueenManager {
    private static instance: RedQueenManager;
    private features: RedQueenFeatures;
    private theme: RedQueenTheme;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        this.features = this.loadFeatures();
        this.theme = this.loadTheme();
        this.setupConfigurationListener();
    }

    public static getInstance(): RedQueenManager {
        if (!RedQueenManager.instance) {
            RedQueenManager.instance = new RedQueenManager();
        }
        return RedQueenManager.instance;
    }

    private loadFeatures(): RedQueenFeatures {
        const config = vscode.workspace.getConfiguration('redqueen.features');
        return {
            redcodeMode: config.get('redcodeMode') ?? true,
            memoryEngine: config.get('memoryEngine') ?? false,
            agentConsole: config.get('agentConsole') ?? false,
            canvasMode: config.get('canvasMode') ?? false
        };
    }

    private loadTheme(): RedQueenTheme {
        const config = vscode.workspace.getConfiguration('redqueen.theme');
        return {
            mode: config.get('mode') ?? 'bluehand',
            dynamicContrast: config.get('dynamicContrast') ?? true,
            fontOverlay: config.get('fontOverlay') ?? true
        };
    }

    private setupConfigurationListener() {
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('redqueen.features')) {
                    this.features = this.loadFeatures();
                    this.updateUI();
                }
                if (e.affectsConfiguration('redqueen.theme')) {
                    this.theme = this.loadTheme();
                    this.updateTheme();
                }
            })
        );
    }

    public isFeatureEnabled(feature: keyof RedQueenFeatures): boolean {
        return this.features[feature];
    }

    public getTheme(): RedQueenTheme {
        return this.theme;
    }

    private updateUI() {
        // Update UI components based on feature flags
        vscode.commands.executeCommand('setContext', 'redqueen.redcodeMode', this.features.redcodeMode);
        vscode.commands.executeCommand('setContext', 'redqueen.memoryEngine', this.features.memoryEngine);
        vscode.commands.executeCommand('setContext', 'redqueen.agentConsole', this.features.agentConsole);
        vscode.commands.executeCommand('setContext', 'redqueen.canvasMode', this.features.canvasMode);
    }

    private updateTheme() {
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
        } else {
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

    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
