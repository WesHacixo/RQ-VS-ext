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
exports.AgentConsoleViewProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const memoryEngine_1 = require("../memory/memoryEngine");
const agentList = [
    { id: 'agent-1', name: 'RedQueen Core', status: 'active' },
    { id: 'agent-2', name: 'Siglent Coder', status: 'idle' }
];
const agentStateKey = 'agentState';
const agentConsoleConfigKey = 'agentConsoleConfig';
class AgentConsoleViewProvider {
    constructor(context) {
        this.memoryEngine = memoryEngine_1.MemoryEngine.getInstance();
        this.context = context;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                if (!message || typeof message.type !== 'string') {
                    return;
                }
                switch (message.type) {
                    case 'FETCH_SR_METRICS': {
                        const metrics = this.memoryEngine.getCurrentMetrics();
                        this.postToWebview({ type: 'SR_METRICS', data: {
                                agentId: 'global',
                                siglenceRatio: metrics.sr,
                                deltaSR: metrics.delta,
                                lsd: metrics.lsd,
                                sae: metrics.sae,
                                mcr: metrics.mcr,
                                timestamp: new Date().toISOString()
                            } });
                        break;
                    }
                    case 'FETCH_IMF_SUMMARY': {
                        const threads = Array.from(this.memoryEngine['memoryThreads'].values());
                        const tags = {};
                        threads.forEach(t => t.metadata.imfTags.forEach(tag => { tags[tag] = (tags[tag] || 0) + 1; }));
                        this.postToWebview({ type: 'IMF_SUMMARY', data: { agentId: 'global', tags } });
                        break;
                    }
                    case 'FETCH_CONCEPT_TOKENS': {
                        const tokens = Array.from(this.memoryEngine['conceptTokens'].values());
                        this.postToWebview({ type: 'CONCEPT_TOKENS', data: tokens.map(t => ({
                                id: t.id,
                                label: t.name,
                                type: t.type,
                                value: t.name
                            })) });
                        break;
                    }
                    case 'FETCH_ACTIVE_AGENTS': {
                        const agentStatus = this.context.workspaceState.get(agentStateKey, {});
                        const agents = agentList.map(agent => ({
                            ...agent,
                            status: agentStatus[agent.id] === false ? 'disabled' : (agent.status === 'disabled' ? 'idle' : agent.status)
                        }));
                        this.postToWebview({ type: 'ACTIVE_AGENTS', data: agents });
                        break;
                    }
                    case 'TOGGLE_AGENT': {
                        const agentStatus = this.context.workspaceState.get(agentStateKey, {});
                        agentStatus[message.agentId] = message.enabled;
                        await this.context.workspaceState.update(agentStateKey, agentStatus);
                        const agents = agentList.map(agent => ({
                            ...agent,
                            status: agentStatus[agent.id] === false ? 'disabled' : (agent.status === 'disabled' ? 'idle' : agent.status)
                        }));
                        this.postToWebview({ type: 'AGENT_STATUS', agentId: message.agentId, enabled: message.enabled });
                        this.postToWebview({ type: 'ACTIVE_AGENTS', data: agents });
                        break;
                    }
                    case 'SEND_PROMPT': {
                        console.log(`[AgentConsole] Prompt sent to agent ${message.agentId}:`, message.prompt);
                        setTimeout(() => {
                            this.postToWebview({
                                type: 'AGENT_STATUS',
                                agentId: message.agentId,
                                enabled: true
                            });
                            this.postToWebview({
                                type: 'SR_METRICS',
                                data: {
                                    agentId: message.agentId,
                                    siglenceRatio: Math.random(),
                                    deltaSR: Math.random() * 0.1,
                                    lsd: Math.random(),
                                    sae: Math.random(),
                                    mcr: Math.random(),
                                    timestamp: new Date().toISOString()
                                }
                            });
                        }, 500);
                        break;
                    }
                    case 'RECOMPUTE_SR': {
                        const metrics = this.memoryEngine.getCurrentMetrics();
                        this.postToWebview({ type: 'SR_METRICS', data: {
                                agentId: 'global',
                                siglenceRatio: metrics.sr,
                                deltaSR: metrics.delta,
                                lsd: metrics.lsd,
                                sae: metrics.sae,
                                mcr: metrics.mcr,
                                timestamp: new Date().toISOString()
                            } });
                        break;
                    }
                    case 'EXPORT_LOGS': {
                        try {
                            const folders = vscode.workspace.workspaceFolders;
                            if (!folders || folders.length === 0) {
                                throw new Error('No workspace folder open');
                            }
                            const filePath = path.join(folders[0].uri.fsPath, 'agent-console-logs.json');
                            fs.writeFileSync(filePath, message.data, 'utf8');
                            vscode.window.showInformationMessage('Agent Console logs exported to agent-console-logs.json');
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Failed to export logs: ' + err);
                        }
                        break;
                    }
                    case 'SETTINGS_UPDATE': {
                        const config = { ...getConfig(this.context), ...message.data };
                        await setConfig(this.context, config);
                        this.postToWebview({ type: 'SETTINGS_SYNC', data: config });
                        console.log(`[AgentConsole] SETTINGS_UPDATE:`, config, new Date().toISOString());
                        break;
                    }
                    case 'SETTINGS_REQUEST': {
                        const config = getConfig(this.context);
                        this.postToWebview({ type: 'SETTINGS_SYNC', data: config });
                        console.log(`[AgentConsole] SETTINGS_REQUEST:`, config, new Date().toISOString());
                        break;
                    }
                    case 'DUMP_CHECKPOINT': {
                        try {
                            const folders = vscode.workspace.workspaceFolders;
                            if (!folders || folders.length === 0) {
                                throw new Error('No workspace folder open');
                            }
                            const filePath = path.join(folders[0].uri.fsPath, 'redqueen.checkpoint.json');
                            // Gather state
                            const config = getConfig(this.context);
                            const agentStatus = this.context.workspaceState.get(agentStateKey, {});
                            const memoryEngine = this.memoryEngine;
                            const srHistory = Array.from(memoryEngine['memoryThreads'].values()).reduce((acc, thread) => {
                                acc[thread.id] = thread.metrics;
                                return acc;
                            }, {});
                            const imfCache = Array.from(memoryEngine['conceptTokens'].values());
                            // Optionally, add logs if available in context
                            const checkpoint = {
                                phase: 'v1.3.1',
                                config,
                                agentStatus,
                                srHistory,
                                imfCache,
                                timestamp: new Date().toISOString()
                            };
                            fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');
                            vscode.window.showInformationMessage('RedQueen checkpoint dumped to redqueen.checkpoint.json');
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Failed to dump checkpoint: ' + err);
                        }
                        break;
                    }
                    case 'REQUEST_FILE_LIST': {
                        try {
                            const folders = vscode.workspace.workspaceFolders;
                            if (!folders || folders.length === 0) {
                                throw new Error('No workspace folder open');
                            }
                            const files = [];
                            const allowedExtensions = ['.ts', '.tsx', '.json', '.md'];
                            // Recursively get all files
                            const getFiles = async (uri) => {
                                const entries = await vscode.workspace.fs.readDirectory(uri);
                                for (const [name, type] of entries) {
                                    const fileUri = vscode.Uri.joinPath(uri, name);
                                    if (type === vscode.FileType.File) {
                                        const ext = path.extname(name).toLowerCase();
                                        if (allowedExtensions.includes(ext)) {
                                            files.push({
                                                path: fileUri.fsPath,
                                                name,
                                                type: ext
                                            });
                                        }
                                    }
                                    else if (type === vscode.FileType.Directory) {
                                        await getFiles(fileUri);
                                    }
                                }
                            };
                            await getFiles(folders[0].uri);
                            this.postToWebview({ type: 'FILE_LIST', payload: files });
                            console.log(`[AgentConsole] File list requested, ${files.length} files found`);
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Failed to get file list: ' + err);
                            console.error(`[AgentConsole] Error getting file list:`, err);
                        }
                        break;
                    }
                    case 'FETCH_FILE_CONTENT': {
                        try {
                            const { path } = message.payload;
                            const uri = vscode.Uri.file(path);
                            const content = await vscode.workspace.fs.readFile(uri);
                            this.postToWebview({
                                type: 'FILE_CONTENT',
                                payload: {
                                    path,
                                    content: new TextDecoder().decode(content)
                                }
                            });
                            console.log(`[AgentConsole] File content fetched for ${path}`);
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Failed to read file: ' + err);
                            if (err instanceof Error) {
                                console.error(`[AgentConsole] Error reading file:`, { path: message.payload.path, error: err.toString() });
                            }
                            else {
                                console.error(`[AgentConsole] Error reading file:`, { path: message.payload.path, error: err });
                            }
                        }
                        break;
                    }
                    case 'SAVE_FILE_CONTENT': {
                        try {
                            const { path, content } = message.payload;
                            const uri = vscode.Uri.file(path);
                            // Verify file is in workspace
                            const folders = vscode.workspace.workspaceFolders;
                            if (!folders || folders.length === 0) {
                                throw new Error('No workspace folder open');
                            }
                            const workspacePath = folders[0].uri.fsPath;
                            if (!path.startsWith(workspacePath)) {
                                throw new Error('Cannot edit files outside workspace');
                            }
                            // Check file size
                            const maxFileSize = 1024 * 1024; // 1MB
                            if (content.length > maxFileSize) {
                                throw new Error(`File size exceeds limit of ${maxFileSize / 1024}KB`);
                            }
                            // Validate file content based on type
                            const ext = path.extname(path).toLowerCase();
                            try {
                                switch (ext) {
                                    case '.json':
                                        JSON.parse(content); // Validate JSON
                                        break;
                                    case '.ts':
                                    case '.tsx':
                                        // Basic TypeScript validation
                                        if (!content.includes('import') && !content.includes('export') && !content.includes('interface') && !content.includes('type')) {
                                            console.warn('File may not be valid TypeScript');
                                        }
                                        break;
                                }
                            }
                            catch (err) {
                                if (err instanceof Error) {
                                    throw new Error(`Invalid file content: ${err.message}`);
                                }
                                else {
                                    throw new Error(`Invalid file content: ${String(err)}`);
                                }
                            }
                            // Create backup
                            const backupPath = `${path}.redqueen.bak`;
                            const backupUri = vscode.Uri.file(backupPath);
                            try {
                                const originalContent = await vscode.workspace.fs.readFile(uri);
                                await vscode.workspace.fs.writeFile(backupUri, originalContent);
                            }
                            catch (err) {
                                console.warn('Failed to create backup:', err);
                            }
                            // Save file
                            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
                            // Log edit with enhanced metadata
                            const editTrace = this.context.workspaceState.get('editTrace', []);
                            editTrace.push({
                                file: path,
                                summary: `Modified ${path.split('/').pop()}`,
                                timestamp: new Date().toISOString(),
                                size: content.length,
                                backup: backupPath,
                                validation: `Validated as ${ext}`
                            });
                            this.context.workspaceState.update('editTrace', editTrace);
                            // Trigger analysis
                            if (this.memoryEngine && typeof this.memoryEngine.analyzeFile === 'function') {
                                this.memoryEngine.analyzeFile(path);
                            }
                            vscode.window.showInformationMessage(`Saved changes to ${path.split('/').pop()}`);
                            console.log('File saved', {
                                path,
                                content,
                            });
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Failed to save file: ' + err);
                            console.log('Error saving file', {
                                path,
                                error: err instanceof Error ? err.toString() : String(err),
                                stack: err instanceof Error ? err.stack : undefined,
                            });
                        }
                        break;
                    }
                    default:
                        this.postToWebview({ type: 'ERROR', message: `Unknown message type: ${message.type}` });
                }
            }
            catch (err) {
                this.postToWebview({ type: 'ERROR', message: String(err) });
            }
        });
    }
    postToWebview(msg) {
        if (this._view) {
            this._view.webview.postMessage(msg);
        }
    }
    getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'ui', 'agentConsoleWebview.js'));
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agent Console</title>
        <style>
          body { margin: 0; padding: 0; font-family: var(--vscode-font-family); background: var(--vscode-sideBar-background); color: var(--vscode-foreground); }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
    }
}
exports.AgentConsoleViewProvider = AgentConsoleViewProvider;
AgentConsoleViewProvider.viewType = 'redqueen.agentConsole';
function getConfig(context) {
    return context.workspaceState.get(agentConsoleConfigKey, {
        loopInterval: 5000,
        looping: false,
        debugMode: false
    });
}
async function setConfig(context, config) {
    await context.workspaceState.update(agentConsoleConfigKey, config);
}
//# sourceMappingURL=agentConsoleViewProvider.js.map