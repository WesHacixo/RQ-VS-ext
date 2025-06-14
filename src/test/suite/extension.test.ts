import * as assert from 'assert';
import * as vscode from 'vscode';

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
        const perf = config.get('performance') as any;
        const mem = config.get('memory') as any;
        const log = config.get('logging') as any;
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
            assert.ok(vscode.extensions.all.some(ext =>
                ext.packageJSON.contributes?.themes?.some((t: any) => t.label === themeLabel)
            ));
        });
    });

    test('Performance monitor should initialize', async () => {
        const extension = vscode.extensions.getExtension('vsblue.vs-blue');
        await extension?.activate();
        const performanceMonitor = extension?.exports.getPerformanceMonitor();
        assert.ok(performanceMonitor);
    });
});
