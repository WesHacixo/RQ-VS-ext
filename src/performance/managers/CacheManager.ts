import * as vscode from 'vscode';
import { ICacheManager } from '../types';

export class CacheManager implements ICacheManager {
    private cache = new Map<string, { timestamp: number; data: any; ttl?: number }>();
    private readonly MAX_CACHE_AGE = 1000 * 60 * 30; // 30 minutes

    public async clear(): Promise<void> {
        try {
            // Clear VS Code document caches
            const documents = vscode.workspace.textDocuments;
            const promises = documents.map(async doc => {
                try {
                    if (doc.isDirty) {
                        await doc.save();
                    }
                    // Close and reopen document to clear cache
                    const viewColumn = vscode.ViewColumn.Beside;
                    await vscode.window.showTextDocument(doc.uri, { 
                        viewColumn, 
                        preserveFocus: true 
                    });
                } catch (error) {
                    console.error(`Error processing document ${doc.uri}:`, error);
                }
            });

            await Promise.all(promises);

            // Clear Node.js require cache (except node_modules)
            if (typeof require !== 'undefined' && require.cache) {
                for (const key of Object.keys(require.cache)) {
                    if (!key.includes('node_modules')) {
                        delete require.cache[key];
                    }
                }
            }

            // Clear custom cache
            this.cache.clear();

            // Run garbage collection if available
            if (typeof global.gc === 'function') {
                global.gc();
            }

            // Clean up old cache entries
            this.cleanupOldEntries();
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }

    public getSize(): number {
        return this.cache.size;
    }

    public set(key: string, data: any, ttl: number = this.MAX_CACHE_AGE): void {
        this.cache.set(key, {
            timestamp: Date.now(),
            data,
            ttl
        });
    }

    public get<T = any>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {return undefined;}

        // Check if entry is expired
        if (Date.now() - entry.timestamp > (entry.ttl || this.MAX_CACHE_AGE)) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data as T;
    }

    public delete(key: string): boolean {
        return this.cache.delete(key);
    }

    private cleanupOldEntries(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > (entry.ttl || this.MAX_CACHE_AGE)) {
                this.cache.delete(key);
            }
        }
    }
}
