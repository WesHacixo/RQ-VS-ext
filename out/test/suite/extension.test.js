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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
suite('VS Blue Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('vsblue.vs-blue');
        assert.ok(extension);
    });
    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('vsblue.vs-blue');
        await extension?.activate();
        assert.ok(extension?.isActive);
    });
    test('Commands should be registered', async () => {
        const commands = [
            'vsblue.toggleMetricsHUD',
            'vsblue.showPerformanceDetails',
            'vsblue.showMemoryDetails',
            'vsblue.showSystemDetails',
            'vsblue.showExtensionDetails',
            'vsblue.showEditorDetails',
            'vsblue.showGCDetails',
            'vsblue.analyzeMemory',
            'vsblue.optimizeMemory'
        ];
        commands.forEach(command => {
            assert.ok(vscode.commands.getCommands(true).then(cmds => cmds.includes(command)));
        });
    });
    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('vsblue');
        const perf = config.get('performance');
        const mem = config.get('memory');
        const log = config.get('logging');
        assert.strictEqual(perf.monitoringInterval, 5000);
        assert.strictEqual(perf.highMemoryThreshold, 0.8);
        assert.strictEqual(perf.criticalMemoryThreshold, 0.9);
        assert.strictEqual(perf.optimizationCooldown, 300000);
        assert.strictEqual(mem.autoOptimize, true);
        assert.strictEqual(mem.clearCacheOnDeactivate, true);
        assert.strictEqual(mem.maxHistorySize, 10);
        assert.strictEqual(mem.leakDetectionThreshold, 0.02);
        assert.strictEqual(log.level, 'info');
        assert.strictEqual(log.maxSize, 5242880);
        assert.strictEqual(log.maxFiles, 5);
    });
    test('Themes should be available', () => {
        const themes = [
            'Blue-Hand Dark',
            'REDCODE Failsafe'
        ];
        themes.forEach(themeLabel => {
            assert.ok(vscode.extensions.all.some(ext => ext.packageJSON.contributes?.themes?.some((t) => t.label === themeLabel)));
        });
    });
    test('Performance monitor should initialize', async () => {
        const extension = vscode.extensions.getExtension('vsblue.vs-blue');
        await extension?.activate();
        const performanceMonitor = extension?.exports.getPerformanceMonitor();
        assert.ok(performanceMonitor);
    });
});
//# sourceMappingURL=extension.test.js.map