import * as vscode from 'vscode';
import { ASTConceptToken, extractConceptTokens } from '../agents/astConceptParser';

// *|Core metrics for semantic analysis|*
interface SemanticMetrics {
    sr: number;      // Siglence Ratio
    lsd: number;     // Latent Semantic Density
    sae: number;     // Surface Activation Energy
    mcr: number;     // Meaning Compression Ratio
    delta: number;   // Change in SR from last analysis
}

// *|Memory thread with enhanced semantic tracking|*
interface MemoryThread {
    id: string;
    timestamp: number;
    type: 'concept' | 'code' | 'conversation' | 'decision';
    content: string;
    metrics: SemanticMetrics;
    metadata: {
        context: string[];
        relationships: string[];
        lastModified: number;
        imfTags: string[];  // Added IMF tag tracking
    };
}

// *|Concept token with semantic weight|*
interface ConceptToken {
    id: string;
    name: string;
    type: 'function' | 'component' | 'hook' | 'pattern' | 'class';
    references: string[];
    metrics: SemanticMetrics;
    metadata: {
        complexity: number;
        lastModified: number;
        imfTags: string[];
        originalType?: string;
    };
}

// *|Core memory engine with semantic analysis|*
export class MemoryEngine {
    private static instance: MemoryEngine;
    private memoryThreads: Map<string, MemoryThread>;
    private conceptTokens: Map<string, ConceptToken>;
    private lastMetrics: Map<string, SemanticMetrics>;
    private disposables: vscode.Disposable[] = [];
    private cacheKey = 'redqueen.memoryCache';

    private constructor() {
        this.memoryThreads = new Map();
        this.conceptTokens = new Map();
        this.lastMetrics = new Map();
        this.setupFileWatcher();
        void this.loadCache();
        // Inject demo data if empty
        setTimeout(() => {
            if (this.memoryThreads.size === 0 && this.conceptTokens.size === 0) {
                const demoContent = `// *|Handles user login intent|*\nfunction loginUser() { return true; }\n// *|Reactive state hook|*\nconst useFormState = () => {};\nclass DashboardWidget {}`;
                const uri = 'demo://demo-file';
                const tokens = extractConceptTokens(demoContent);
                const metrics = this.calculateSemanticMetrics(demoContent, tokens.map(t => t.name), uri);
                const thread: MemoryThread = {
                    id: uri,
                    timestamp: Date.now(),
                    type: 'code',
                    content: demoContent,
                    metrics,
                    metadata: {
                        context: tokens.map(t => t.name),
                        relationships: [],
                        lastModified: Date.now(),
                        imfTags: tokens.flatMap(t => t.imfTag ? [t.imfTag] : [])
                    }
                };
                this.memoryThreads.set(thread.id, thread);
                this.updateConceptTokensFromObjects(tokens, uri, metrics);
            }
        }, 1000);
    }

    public static getInstance(): MemoryEngine {
        if (!MemoryEngine.instance) {
            MemoryEngine.instance = new MemoryEngine();
        }
        return MemoryEngine.instance;
    }

    private setupFileWatcher() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');

        this.disposables.push(
            watcher.onDidChange(uri => this.processFileChange(uri)),
            watcher.onDidCreate(uri => this.processFileChange(uri)),
            watcher.onDidDelete(uri => this.removeFileMemory(uri))
        );
    }

    // *|Processes file changes with semantic analysis|*
    private async processFileChange(uri: vscode.Uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const tokens = extractConceptTokens(content);
            const metrics = this.calculateSemanticMetrics(content, tokens.map(t => t.name), uri.toString());
            const thread: MemoryThread = {
                id: uri.toString(),
                timestamp: Date.now(),
                type: 'code',
                content: content,
                metrics: metrics,
                metadata: {
                    context: tokens.map(t => t.name),
                    relationships: this.findRelationships(tokens.map(t => t.name)),
                    lastModified: Date.now(),
                    imfTags: tokens.flatMap(t => t.imfTag ? [t.imfTag] : [])
                }
            };
            this.memoryThreads.set(thread.id, thread);
            this.updateConceptTokensFromObjects(tokens, uri.toString(), metrics);
            vscode.commands.executeCommand('redqueen.updateMetrics', metrics);
            void this.saveCache();
        } catch (error) {
            console.error('Error processing file change:', error);
        }
    }

    // *|Removes file memory and updates related concepts|*
    private removeFileMemory(uri: vscode.Uri) {
        this.memoryThreads.delete(uri.toString());
        this.lastMetrics.delete(uri.toString());
        for (const [id, token] of this.conceptTokens) {
            const index = token.references.indexOf(uri.toString());
            if (index !== -1) {
                token.references.splice(index, 1);
                if (token.references.length === 0) {
                    this.conceptTokens.delete(id);
                }
            }
        }
        void this.saveCache();
    }

    // *|Calculates semantic metrics for content|*
    private calculateSemanticMetrics(content: string, concepts: string[], id: string): SemanticMetrics {
        const lsd = this.calculateLSD(content, concepts);
        const sae = this.calculateSAE(content);
        const mcr = this.calculateMCR(concepts);
        const sr = lsd / sae;
        const delta = this.calculateDelta(id, { sr, lsd, sae, mcr, delta: 0 });

        return { sr, lsd, sae, mcr, delta };
    }

    // *|Calculates delta between current and previous metrics|*
    private calculateDelta(id: string, current: SemanticMetrics): number {
        const previous = this.lastMetrics.get(id);
        this.lastMetrics.set(id, current);
        return previous ? current.sr - previous.sr : 0;
    }

    // *|Calculates Latent Semantic Density|*
    private calculateLSD(content: string, concepts: string[]): number {
        // TODO: Implement proper LSD calculation
        // For now, use a simple ratio of concepts to content length
        return Math.min(concepts.length / (content.length / 100), 1);
    }

    // *|Calculates Surface Activation Energy|*
    private calculateSAE(content: string): number {
        // TODO: Implement proper SAE calculation
        // For now, use a simple complexity metric
        const lines = content.split('\n').length;
        const complexity = content.split('{').length;
        return Math.min(complexity / lines, 1);
    }

    // *|Calculates Meaning Compression Ratio|*
    private calculateMCR(concepts: string[]): number {
        // TODO: Implement proper MCR calculation
        // For now, use a simple ratio of unique concepts
        const uniqueConcepts = new Set(concepts).size;
        return Math.min(uniqueConcepts / concepts.length, 1);
    }

    // *|Detects concept type from content|*
    private detectConceptType(content: string, concept: string): ConceptToken['type'] {
        if (content.includes(`use${concept}`)) {return 'hook';}
        if (content.includes(`<${concept}`)) {return 'component';}
        if (/pattern/i.test(concept)) {return 'pattern';}
        return 'function';
    }

    // *|Finds relationships between concepts|*
    private findRelationships(concepts: string[]): string[] {
        // TODO: Implement relationship detection
        return [];
    }

    // *|Updates concept tokens with semantic metrics|*
    private updateConceptTokensFromObjects(tokens: ASTConceptToken[], uri: string, metrics: SemanticMetrics) {
        for (const t of tokens) {
            const key = `${uri}#${t.name}`;
            const existing = this.conceptTokens.get(key);
            if (existing) {
                if (!existing.references.includes(uri)) {
                    existing.references.push(uri);
                }
                existing.metadata.lastModified = Date.now();
                if (t.imfTag) {
                    existing.metadata.imfTags = [...new Set([...existing.metadata.imfTags, t.imfTag])];
                }
                existing.metrics = {
                    sr: (existing.metrics.sr + metrics.sr) / 2,
                    lsd: (existing.metrics.lsd + metrics.lsd) / 2,
                    sae: (existing.metrics.sae + metrics.sae) / 2,
                    mcr: (existing.metrics.mcr + metrics.mcr) / 2,
                    delta: metrics.delta
                };
                this.conceptTokens.set(key, existing);
            } else {
                const token = {
                    id: key,
                    name: t.name,
                    type: t.type,
                    references: [uri],
                    metrics: metrics,
                    metadata: {
                        complexity: 1,
                        lastModified: Date.now(),
                        imfTags: t.imfTag ? [t.imfTag] : [],
                        originalType: t.type
                    }
                };
                this.conceptTokens.set(key, token);
            }
        }
        void this.saveCache();
    }

    // *|Gets memory thread with semantic metrics|*
    public getMemoryThread(id: string): MemoryThread | undefined {
        return this.memoryThreads.get(id);
    }

    // *|Gets concept token with semantic metrics|*
    public getConceptToken(id: string): ConceptToken | undefined {
        return this.conceptTokens.get(id);
    }

    // *|Gets related concepts with semantic analysis|*
    public getRelatedConcepts(conceptId: string): ConceptToken[] {
        const token = this.conceptTokens.get(conceptId);
        if (!token) {return [];}

        return Array.from(this.conceptTokens.values())
            .filter(t => t.references.some(r => token.references.includes(r)));
    }

    // *|Gets current semantic metrics with historical trend|*
    public getCurrentMetrics(): SemanticMetrics {
        const threads = Array.from(this.memoryThreads.values());
        const tokens = Array.from(this.conceptTokens.values());

        const avgSR = threads.reduce((sum, t) => sum + t.metrics.sr, 0) / threads.length;
        const avgLSD = threads.reduce((sum, t) => sum + t.metrics.lsd, 0) / threads.length;
        const avgSAE = threads.reduce((sum, t) => sum + t.metrics.sae, 0) / threads.length;
        const avgMCR = tokens.reduce((sum, t) => sum + t.metrics.mcr, 0) / tokens.length;

        // Calculate overall delta from historical metrics
        const deltas = threads.map(t => t.metrics.delta);
        const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;

        return {
            sr: avgSR,
            lsd: avgLSD,
            sae: avgSAE,
            mcr: avgMCR,
            delta: avgDelta
        };
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }

    private async saveCache() {
        const cache = {
            memoryThreads: Array.from(this.memoryThreads.entries()),
            conceptTokens: Array.from(this.conceptTokens.entries())
        };
        await vscode.workspace.getConfiguration().update(this.cacheKey, cache, vscode.ConfigurationTarget.Global);
    }

    private async loadCache() {
        const cache = vscode.workspace.getConfiguration().get<any>(this.cacheKey);
        if (cache) {
            this.memoryThreads = new Map(cache.memoryThreads);
            this.conceptTokens = new Map(cache.conceptTokens);
            if (this.memoryThreads.size > 0 || this.conceptTokens.size > 0) {
                console.log('[MemoryEngine] IMF/Token cache loaded and validated.');
            } else {
                console.warn('[MemoryEngine] IMF/Token cache loaded but is empty or invalid.');
            }
        } else {
            console.log('[MemoryEngine] No cache found in persistent storage.');
        }
    }

    private hasFileChanged(uri: vscode.Uri, content: string): boolean {
        // TODO: Implement hash/timestamp comparison
        return true;
    }
}
