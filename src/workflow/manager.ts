import * as vscode from 'vscode';

export class WorkflowManager {
    private context: vscode.ExtensionContext;
    private liveCodeChecker: LiveCodeChecker;
    private terminalManager: TerminalManager;
    private highlightManager: HighlightManager;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.liveCodeChecker = new LiveCodeChecker(context);
        this.terminalManager = new TerminalManager(context);
        this.highlightManager = new HighlightManager(context);

        this.initialize();
    }

    private initialize(): void {
        this.liveCodeChecker.start();
        this.terminalManager.setup();
        this.highlightManager.enable();
    }

    public dispose(): void {
        this.liveCodeChecker.dispose();
        this.terminalManager.dispose();
        this.highlightManager.dispose();
    }
}

class LiveCodeChecker {
    private isActive: boolean = false;
    private context: vscode.ExtensionContext;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];
    private documentCache: Map<vscode.TextDocument, { timestamp: number; diagnostics: vscode.Diagnostic[] }> = new Map();
    private readonly CACHE_TTL = 5000; // 5 seconds cache TTL
    private readonly MAX_CACHE_SIZE = 100; // Maximum number of documents to cache
    private readonly BATCH_SIZE = 10; // Number of documents to process in a batch
    private processingQueue: Set<vscode.TextDocument> = new Set();
    private isProcessing: boolean = false;
    private lastCleanupTime: number = 0;
    private readonly CLEANUP_INTERVAL = 60000; // Cleanup every minute
    private memoryUsage: { heapUsed: number; heapTotal: number } = { heapUsed: 0, heapTotal: 0 };

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('vsblue');
        this.updateMemoryUsage();
    }

    private updateMemoryUsage(): void {
        const usage = process.memoryUsage();
        this.memoryUsage = {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal
        };
    }

    public start(): void {
        if (this.isActive) { return; }
        this.isActive = true;
        this.setupEventListeners();
        this.checkAllVisibleDocuments();
        this.startPeriodicCleanup();
    }

    public stop(): void {
        if (!this.isActive) { return; }
        this.isActive = false;
        this.dispose();
    }

    private startPeriodicCleanup(): void {
        const cleanupInterval = setInterval(() => {
            if (this.isActive) {
                this.cleanupCache();
                this.updateMemoryUsage();
            } else {
                clearInterval(cleanupInterval);
            }
        }, this.CLEANUP_INTERVAL);

        this.disposables.push({ dispose: () => clearInterval(cleanupInterval) });
    }

    private setupEventListeners(): void {
        // Check code on document change with debounce
        const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive) {
                this.queueDocumentForProcessing(event.document);
            }
        });

        // Check code on document open
        const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
            if (this.isActive) {
                this.queueDocumentForProcessing(document);
            }
        });

        // Clear diagnostics on document close
        const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
            this.diagnosticCollection.delete(document.uri);
            this.documentCache.delete(document);
            this.processingQueue.delete(document);
        });

        // Monitor workspace changes
        const workspaceDisposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.cleanupCache();
        });

        // Monitor memory pressure
        const memoryPressureDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('vsblue.performance')) {
                this.updateMemoryUsage();
                if (this.memoryUsage.heapUsed / this.memoryUsage.heapTotal > 0.8) {
                    this.cleanupCache();
                }
            }
        });

        this.disposables.push(
            changeDisposable,
            openDisposable,
            closeDisposable,
            workspaceDisposable,
            memoryPressureDisposable
        );
    }

    private queueDocumentForProcessing(document: vscode.TextDocument): void {
        if (!this.shouldCheckDocument(document)) { return; }
        this.processingQueue.add(document);
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.processingQueue.size === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            const batch = Array.from(this.processingQueue).slice(0, this.BATCH_SIZE);
            batch.forEach(doc => this.processingQueue.delete(doc));

            await Promise.all(batch.map(doc => this.processDocument(doc)));

            if (this.processingQueue.size > 0) {
                // Process remaining items in the next tick
                setTimeout(() => this.processQueue(), 0);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private async processDocument(document: vscode.TextDocument): Promise<void> {
        if (!this.shouldCheckDocument(document)) { return; }

        const now = Date.now();
        const cached = this.documentCache.get(document);

        // Use cache if valid
        if (cached && now - cached.timestamp < this.CACHE_TTL) {
            this.diagnosticCollection.set(document.uri, cached.diagnostics);
            return;
        }

        const diagnostics = await this.analyzeDocument(document);
        this.documentCache.set(document, { timestamp: now, diagnostics });
        this.diagnosticCollection.set(document.uri, diagnostics);

        // Check memory pressure
        this.updateMemoryUsage();
        if (this.memoryUsage.heapUsed / this.memoryUsage.heapTotal > 0.8) {
            this.cleanupCache();
        }
    }

    private async analyzeDocument(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Process lines in chunks to avoid blocking
        const chunkSize = 100;
        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize);
            await new Promise(resolve => setTimeout(resolve, 0)); // Allow other operations

            for (let j = 0; j < chunk.length; j++) {
                const line = chunk[j];
                if (line.length > 0) {
                    this.checkLineLength(line, i + j, diagnostics);
                    this.checkTodoComments(line, i + j, diagnostics);
                    this.checkConsoleStatements(line, i + j, diagnostics);
                    this.checkUnusedImports(line, i + j, diagnostics);
                }
            }

            // Check memory pressure during processing
            this.updateMemoryUsage();
            if (this.memoryUsage.heapUsed / this.memoryUsage.heapTotal > 0.9) {
                this.cleanupCache();
                break; // Stop processing if memory pressure is too high
            }
        }

        return diagnostics;
    }

    private cleanupCache(): void {
        const now = Date.now();
        if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL) {
            return; // Don't clean up too frequently
        }

        this.lastCleanupTime = now;
        this.updateMemoryUsage();

        // Force garbage collection if memory pressure is high
        if (this.memoryUsage.heapUsed / this.memoryUsage.heapTotal > 0.9) {
            if (typeof global.gc === 'function') {
                global.gc();
            }
        }

        // Remove stale cache entries
        const staleEntries: vscode.TextDocument[] = [];
        for (const [document, data] of this.documentCache.entries()) {
            if (now - data.timestamp > this.CACHE_TTL) {
                staleEntries.push(document);
            }
        }

        // Remove stale entries
        staleEntries.forEach(document => {
            this.documentCache.delete(document);
            this.diagnosticCollection.delete(document.uri);
        });

        // If cache is still too large, remove oldest entries
        if (this.documentCache.size > this.MAX_CACHE_SIZE) {
            const entries = Array.from(this.documentCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
            toRemove.forEach(([document]) => {
                this.documentCache.delete(document);
                this.diagnosticCollection.delete(document.uri);
            });
        }

        // Clear processing queue if it's too large
        if (this.processingQueue.size > this.BATCH_SIZE * 2) {
            const documents = Array.from(this.processingQueue);
            this.processingQueue.clear();

            // Keep only the most recently modified documents
            const recentDocuments = documents
                .sort((a, b) => b.version - a.version)
                .slice(0, this.BATCH_SIZE);

            recentDocuments.forEach(doc => this.processingQueue.add(doc));
        }

        // Log cleanup results
        console.log(`Cache cleanup completed:\n- Removed ${staleEntries.length} stale entries\n- Cache size: ${this.documentCache.size}/${this.MAX_CACHE_SIZE}\n- Queue size: ${this.processingQueue.size}\n- Memory usage: ${(this.memoryUsage.heapUsed / this.memoryUsage.heapTotal * 100).toFixed(2)}%`);
    }

    private checkAllVisibleDocuments(): void {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (this.isActive) {
                this.queueDocumentForProcessing(editor.document);
            }
        });
    }

    private shouldCheckDocument(document: vscode.TextDocument): boolean {
        const supportedLanguages = [
            'javascript', 'typescript', 'python', 'markdown',
            'yaml', 'json', 'lisp', 'scheme'
        ];
        return supportedLanguages.includes(document.languageId);
    }

    private checkLineLength(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[]): void {
        const maxLength = 120;
        if (line.length > maxLength) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineIndex, maxLength, lineIndex, line.length),
                `Line exceeds ${maxLength} characters`,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'VS Blue';
            diagnostics.push(diagnostic);
        }
    }

    private checkTodoComments(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[]): void {
        const todoPattern = /\b(TODO|FIXME|HACK|XXX)\b/gi;
        let match;

        while ((match = todoPattern.exec(line)) !== null) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineIndex, match.index, lineIndex, match.index + match[0].length),
                `${match[0]} comment found`,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'VS Blue';
            diagnostics.push(diagnostic);
        }
    }

    private checkConsoleStatements(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[]): void {
        const consolePattern = /console\.(log|warn|error|debug)/g;
        let match;

        while ((match = consolePattern.exec(line)) !== null) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineIndex, match.index, lineIndex, match.index + match[0].length),
                'Console statement detected - consider removing for production',
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'VS Blue';
            diagnostics.push(diagnostic);
        }
    }

    private checkUnusedImports(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[]): void {
        // Enhanced import pattern matching
        const importPatterns = [
            /^import\s+{([^}]+)}\s+from\s+['"].*['"];?$/,  // Named imports
            /^import\s+(\w+)\s+from\s+['"].*['"];?$/,      // Default imports
            /^import\s+\*\s+as\s+(\w+)\s+from\s+['"].*['"];?$/  // Namespace imports
        ];

        for (const pattern of importPatterns) {
            const match = line.trim().match(pattern);
            if (match) {
                const importName = match[1];
                const document = vscode.window.activeTextEditor?.document;

                if (document) {
                    const text = document.getText();
                    // Check if the import is used elsewhere in the file
                    const usageCount = (text.match(new RegExp(`\\b${importName}\\b`, 'g')) || []).length;

                    if (usageCount <= 1) { // Only found in the import statement
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(lineIndex, 0, lineIndex, line.length),
                            `Potentially unused import: ${importName}`,
                            vscode.DiagnosticSeverity.Hint
                        );
                        diagnostic.source = 'VS Blue';
                        diagnostic.code = 'unused-import';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
    }

    public dispose(): void {
        this.stop();
        this.diagnosticCollection.dispose();
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.documentCache.clear();
        this.processingQueue.clear();
    }
}

class TerminalManager {
    private context: vscode.ExtensionContext;
    private terminals: Map<string, vscode.Terminal> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public setup(): void {
        this.registerCommands();
        this.setupEventListeners();
    }

    private registerCommands(): void {
        const openExternalTerminal = vscode.commands.registerCommand('vsblue.openExternalTerminal', () => {
            this.openExternalTerminal();
        });

        const createNamedTerminal = vscode.commands.registerCommand('vsblue.createNamedTerminal', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter terminal name',
                placeHolder: 'Terminal name'
            });

            if (name) {
                this.createNamedTerminal(name);
            }
        });

        this.context.subscriptions.push(openExternalTerminal, createNamedTerminal);
    }

    private setupEventListeners(): void {
        vscode.window.onDidCloseTerminal((terminal) => {
            // Remove from our tracking
            for (const [name, term] of this.terminals.entries()) {
                if (term === terminal) {
                    this.terminals.delete(name);
                    break;
                }
            }
        });
    }

    private openExternalTerminal(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder?.uri.fsPath || process.cwd();

        const terminal = vscode.window.createTerminal({
            name: 'VS Blue External',
            cwd: cwd,
            env: {
                ...process.env,
                VS_BLUE_ACTIVE: 'true'
            }
        });

        terminal.show();
        this.terminals.set('external', terminal);
    }

    private createNamedTerminal(name: string): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder?.uri.fsPath || process.cwd();

        const terminal = vscode.window.createTerminal({
            name: `VS Blue: ${name}`,
            cwd: cwd,
            env: {
                ...process.env,
                VS_BLUE_ACTIVE: 'true',
                VS_BLUE_TERMINAL_NAME: name
            }
        });

        terminal.show();
        this.terminals.set(name, terminal);
    }

    public dispose(): void {
        this.terminals.forEach(terminal => terminal.dispose());
        this.terminals.clear();
    }
}

class HighlightManager {
    private context: vscode.ExtensionContext;
    private decorationType: vscode.TextEditorDecorationType | undefined;
    private isEnabled: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.setupDecorations();
    }

    public enable(): void {
        if (this.isEnabled) {return;}

        this.isEnabled = true;
        this.setupEventListeners();
        console.log('VS Blue: Highlight overlay enabled');
    }

    public disable(): void {
        if (!this.isEnabled) {return;}

        this.isEnabled = false;
        this.clearHighlights();
        console.log('VS Blue: Highlight overlay disabled');
    }

    private setupDecorations(): void {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(79, 124, 172, 0.2)',
            border: '1px solid rgba(79, 124, 172, 0.4)',
            borderRadius: '3px',
            overviewRulerColor: '#4f7cac',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }

    private setupEventListeners(): void {
        vscode.window.onDidChangeTextEditorSelection((event) => {
            if (this.isEnabled) {
                this.updateHighlights(event.textEditor);
            }
        });

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (this.isEnabled && editor) {
                this.updateHighlights(editor);
            }
        });
    }

    private updateHighlights(editor: vscode.TextEditor): void {
        if (!this.decorationType) {return;}

        const selection = editor.selection;
        if (selection.isEmpty) {
            editor.setDecorations(this.decorationType, []);
            return;
        }

        const selectedText = editor.document.getText(selection);
        if (selectedText.length < 2) {
            editor.setDecorations(this.decorationType, []);
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const text = editor.document.getText();
        const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // Don't highlight the current selection
            if (!range.isEqual(selection)) {
                decorations.push({
                    range,
                    hoverMessage: `Occurrence of "${selectedText}"`
                });
            }
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    private clearHighlights(): void {
        if (this.decorationType) {
            vscode.window.visibleTextEditors.forEach(editor => {
                editor.setDecorations(this.decorationType!, []);
            });
        }
    }

    public dispose(): void {
        this.disable();
        if (this.decorationType) {
            this.decorationType.dispose();
        }
    }
}
