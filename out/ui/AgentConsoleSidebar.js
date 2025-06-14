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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentConsoleSidebar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const auto_1 = __importDefault(require("chart.js/auto"));
const react_1 = __importStar(require("react"));
const buildOptimizerManifest_1 = require("../config/buildOptimizerManifest");
const FEATURE_FLAGS_1 = require("../config/FEATURE_FLAGS");
require("./AgentConsoleSidebar.css");
const SettingsPanel_1 = __importDefault(require("./SettingsPanel"));
const TaskDetailPanel_1 = require("./TaskDetailPanel");
// --- MessageBridge Hook ---
function useMessageBridge(onMessage) {
    const postMessage = (msg) => {
        if (window.acquireVsCodeApi) {
            const vscode = window.acquireVsCodeApi();
            vscode.postMessage(msg);
        }
        else {
            window.parent.postMessage(msg, "*");
        }
    };
    (0, react_1.useEffect)(() => {
        const handler = (event) => {
            if (event.data && event.data.type) {
                onMessage(event.data);
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [onMessage]);
    return { postMessage };
}
// --- Helper: Get message type from log string or object ---
function getMessageType(log) {
    const match = log.match(/\b(SR_METRICS|IMF_SUMMARY|AGENT_STATUS|ACTIVE_AGENTS|CONCEPT_TOKENS|ERROR|TOGGLE_AGENT|SEND_PROMPT|RECOMPUTE_SR|FETCH_\w+)\b/);
    return match ? match[1] : "OTHER";
}
// --- Helper: Format SR metrics for display ---
const formatMetricValue = (value) => {
    return (value * 100).toFixed(1) + '%';
};
const getMetricTrend = (current, previous) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.01)
        return '→';
    return diff > 0 ? '↑' : '↓';
};
const getMetricColor = (value) => {
    if (value >= 0.8)
        return '#4caf50'; // Good (green)
    if (value >= 0.6)
        return '#ff9800'; // Warning (orange)
    return '#f44336'; // Poor (red)
};
const MetricCard = ({ label, value, previousValue, tooltip, debugMode, timestamp }) => ((0, jsx_runtime_1.jsxs)("div", { className: "metric-card", title: debugMode ? `SR: ${value} @ ${timestamp}` : undefined, style: {
        padding: '8px',
        margin: '4px',
        borderRadius: '4px',
        backgroundColor: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-widget-border)'
    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.9em', color: 'var(--vscode-descriptionForeground)' }, children: label }), (0, jsx_runtime_1.jsxs)("div", { style: {
                fontSize: '1.2em',
                color: getMetricColor(value),
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }, children: [formatMetricValue(value), previousValue && ((0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.8em', opacity: 0.8 }, children: getMetricTrend(value, previousValue) }))] })] }));
// --- System Status Panel ---
const getStatus = (srMetrics, error) => {
    if (error)
        return { label: 'Error', color: '#f44336', tooltip: error };
    if (!srMetrics || isNaN(srMetrics.siglenceRatio))
        return { label: 'Waiting', color: '#ff9800', tooltip: 'Waiting for SR metrics from backend.' };
    return { label: 'Ready', color: '#4caf50', tooltip: `SR: ${(srMetrics.siglenceRatio * 100).toFixed(1)}% | Last updated: ${srMetrics.timestamp}` };
};
// --- SR Drift Tracker State ---
const [srHistory, setSRHistory] = (0, react_1.useState)({});
// --- SR Drift Chart with Chart.js ---
const [chartZoom, setChartZoom] = (0, react_1.useState)(1);
const chartRef = (0, react_1.useRef)(null);
const SRDriftChart = ({ history, zoom, onRef }) => {
    const canvasRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!canvasRef.current || !history.length)
            return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx)
            return;
        const displayHistory = zoom < 1 ? history : history.slice(-Math.max(2, Math.round(history.length * zoom)));
        const chart = new auto_1.default(ctx, {
            type: 'line',
            data: {
                labels: displayHistory.map(h => new Date(h.timestamp).toLocaleTimeString()),
                datasets: [{
                        label: 'SR',
                        data: displayHistory.map(h => h.sr),
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76,175,80,0.2)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.2
                    }]
            },
            options: {
                responsive: false,
                plugins: {
                    tooltip: { enabled: true },
                    legend: { display: false }
                },
                scales: {
                    y: { min: 0, max: 1, title: { display: true, text: 'SR' } },
                    x: { title: { display: true, text: 'Time' } }
                }
            }
        });
        if (onRef)
            onRef(chart);
        return () => { chart.destroy(); };
    }, [history, zoom]);
    return (0, jsx_runtime_1.jsx)("canvas", { ref: canvasRef, width: 220, height: 60, style: { background: '#222', borderRadius: 4 } });
};
// Lazy load dev overlays and drift simulator
const DevOverlays = react_1.default.lazy(() => Promise.resolve().then(() => __importStar(require('./DevOverlays'))));
const DriftSimulator = react_1.default.lazy(() => Promise.resolve().then(() => __importStar(require('./DriftSimulator'))));
const AgentConsoleSidebar = ({ taskManager, budgetLimits, tasks, onCancelTask, onBoostPriority, onDuplicateTask }) => {
    const [agents, setAgents] = (0, react_1.useState)([]);
    const [srMetrics, setSRMetrics] = (0, react_1.useState)(null);
    const [imfSummary, setIMFSummary] = (0, react_1.useState)(null);
    const [conceptTokens, setConceptTokens] = (0, react_1.useState)([]);
    const [theme, setTheme] = (0, react_1.useState)("BlueHand");
    const [prompt, setPrompt] = (0, react_1.useState)("");
    const [selectedAgent, setSelectedAgent] = (0, react_1.useState)("");
    const [logs, setLogs] = (0, react_1.useState)(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = window.localStorage.getItem('agentConsoleLogs');
                return stored ? JSON.parse(stored) : [];
            }
            catch {
                return [];
            }
        }
        return [];
    });
    const [logFilter, setLogFilter] = (0, react_1.useState)('ALL');
    const [expandedLogs, setExpandedLogs] = (0, react_1.useState)(new Set());
    const [budget, setBudget] = (0, react_1.useState)({ cpuUsed: 0, remoteCalls: 0 });
    const logRef = (0, react_1.useRef)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [loopInterval, setLoopInterval] = (0, react_1.useState)(5000);
    const [looping, setLooping] = (0, react_1.useState)(false);
    const [debugMode, setDebugMode] = (0, react_1.useState)(false);
    const [selectedTask, setSelectedTask] = (0, react_1.useState)(null);
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(true);
    // --- LogBridge Filters ---
    const logTypes = ['ALL', 'INBOUND', 'OUTBOUND', 'ERROR'];
    const [logTypeFilter, setLogTypeFilter] = (0, react_1.useState)(() => window.localStorage?.getItem('logTypeFilter') || 'ALL');
    (0, react_1.useEffect)(() => { window.localStorage?.setItem('logTypeFilter', logTypeFilter); }, [logTypeFilter]);
    const [exportMsg, setExportMsg] = (0, react_1.useState)(null);
    const handleExportLogs = async (format) => {
        if (format === 'json') {
            const data = JSON.stringify(logs, null, 2);
            if (window.acquireVsCodeApi) {
                const vscode = window.acquireVsCodeApi();
                vscode.postMessage({ type: 'EXPORT_LOGS', format: 'json', data });
                setExportMsg('Exported logs to agent-console-logs.json');
                setTimeout(() => setExportMsg(null), 3000);
            }
            else {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'agent-console-logs.json';
                a.click();
                URL.revokeObjectURL(url);
                setExportMsg('Downloaded logs as agent-console-logs.json');
                setTimeout(() => setExportMsg(null), 3000);
            }
        }
        else {
            setExportMsg('Markdown export not implemented yet.');
            setTimeout(() => setExportMsg(null), 3000);
        }
    };
    // --- LogBridge ---
    const logMessage = (level, message) => {
        const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
        setLogs(l => {
            const updated = [...l, entry];
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    window.localStorage.setItem('agentConsoleLogs', JSON.stringify(updated));
                }
                catch { }
            }
            return updated;
        });
    };
    (0, react_1.useEffect)(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);
    // --- Log Filtering ---
    const filteredLogs = logs.filter(log => {
        if (logTypeFilter === 'ALL')
            return true;
        if (logTypeFilter === 'INBOUND')
            return log.includes('Inbound');
        if (logTypeFilter === 'OUTBOUND')
            return log.includes('Outbound');
        if (logTypeFilter === 'ERROR')
            return log.includes('ERROR');
        return true;
    });
    // --- Expand/Collapse ---
    const toggleExpand = (idx) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(idx))
                next.delete(idx);
            else
                next.add(idx);
            return next;
        });
    };
    // --- MessageBridge integration ---
    const { postMessage } = useMessageBridge((msg) => {
        logMessage("Inbound", msg.type);
        switch (msg.type) {
            case "ACTIVE_AGENTS":
                setAgents(msg.data);
                break;
            case "SR_METRICS":
                setSRMetrics(msg.data);
                break;
            case "IMF_SUMMARY":
                setIMFSummary(msg.data);
                break;
            case "CONCEPT_TOKENS":
                setConceptTokens(msg.data);
                break;
            case "AGENT_STATUS":
                setAgents((prev) => prev.map(a => a.id === msg.agentId ? { ...a, status: msg.enabled ? "active" : "disabled" } : a));
                break;
            case "ERROR":
                setError(msg.message);
                break;
            case "SETTINGS_SYNC":
                setLoopInterval(msg.data.loopInterval);
                setLooping(msg.data.looping);
                setDebugMode(msg.data.debugMode);
                logMessage('info', 'Settings synced');
                break;
            default:
                break;
        }
    });
    // --- Theme adaptation (with manual toggle) ---
    const handleThemeSwitch = () => {
        setTheme(t => t === "BlueHand" ? "REDCODE" : "BlueHand");
        logMessage('info', 'Theme switched');
    };
    // --- Initial data fetch ---
    (0, react_1.useEffect)(() => {
        postMessage({ type: "FETCH_ACTIVE_AGENTS" });
        postMessage({ type: "FETCH_SR_METRICS" });
        postMessage({ type: "FETCH_IMF_SUMMARY" });
        postMessage({ type: "FETCH_CONCEPT_TOKENS" });
    }, []);
    // --- Panel Handlers (with logging) ---
    const handleToggleAgent = (id, enabled) => {
        logMessage('info', 'Toggle agent');
        postMessage({ type: "TOGGLE_AGENT", agentId: id, enabled });
    };
    const handleSendPrompt = () => {
        if (selectedAgent && prompt) {
            logMessage('info', 'Send prompt');
            postMessage({ type: "SEND_PROMPT", agentId: selectedAgent, prompt });
            setPrompt("");
        }
    };
    const handleRecomputeSR = () => {
        logMessage('info', 'Recompute SR');
        postMessage({ type: "RECOMPUTE_SR", agentId: selectedAgent });
    };
    const handleRefreshIMF = () => {
        logMessage('info', 'Refresh IMF');
        postMessage({ type: "FETCH_IMF_SUMMARY", agentId: selectedAgent });
    };
    // --- Settings Handlers ---
    const handleLoopIntervalChange = (val) => {
        setLoopInterval(val);
        postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval: val, looping, debugMode } });
        logMessage('info', 'Loop interval changed');
    };
    const handleLoopingChange = (val) => {
        setLooping(val);
        postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval, looping: val, debugMode } });
        logMessage('info', 'Looping changed');
    };
    const handleDebugModeChange = (val) => {
        setDebugMode(val);
        postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval, looping, debugMode: val } });
        logMessage('info', 'Debug mode changed');
    };
    // Add task update handler
    (0, react_1.useEffect)(() => {
        const handleTaskUpdate = (task) => {
            // This is a placeholder implementation. You might want to update the state
            // to reflect the changes in the task list.
        };
        const handleBudgetUpdate = (budget) => {
            setBudget(budget);
        };
        const cleanupTaskUpdate = taskManager.onTaskUpdate(handleTaskUpdate);
        const cleanupBudgetUpdate = taskManager.budgetTracker.onBudgetUpdate(handleBudgetUpdate);
        return () => {
            cleanupTaskUpdate();
            cleanupBudgetUpdate();
        };
    }, [taskManager]);
    // --- Render ---
    return ((0, jsx_runtime_1.jsxs)("div", { className: `agent-console-sidebar theme-${theme.toLowerCase()} ${isExpanded ? 'expanded' : 'collapsed'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "sidebar-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Agent Console" }), (0, jsx_runtime_1.jsx)("button", { className: "toggle-button", onClick: () => setIsExpanded(!isExpanded), children: isExpanded ? '←' : '→' })] }), isExpanded && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "control-buttons", children: (0, jsx_runtime_1.jsx)("button", { onClick: handleThemeSwitch, children: "Switch Theme" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "log-filters", children: [logTypes.map(type => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setLogTypeFilter(type), className: logTypeFilter === type ? 'active' : '', children: type }, type))), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleExportLogs('json'), children: "Export JSON" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleExportLogs('md'), children: "Export MD" }), exportMsg && (0, jsx_runtime_1.jsx)("span", { className: "export-message", children: exportMsg })] }), (0, jsx_runtime_1.jsxs)("section", { className: "agents-panel", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Active Agents" }), (0, jsx_runtime_1.jsx)("ul", { children: agents.map(agent => ((0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsxs)("span", { children: [agent.name, " (", agent.status, ")"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleToggleAgent(agent.id, agent.status !== "active"), children: agent.status === "active" ? "Disable" : "Enable" })] }, agent.id))) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "prompt-panel", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Prompt Builder" }), (0, jsx_runtime_1.jsxs)("select", { value: selectedAgent, onChange: e => setSelectedAgent(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Agent" }), agents.map(agent => ((0, jsx_runtime_1.jsx)("option", { value: agent.id, children: agent.name }, agent.id)))] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: prompt, onChange: e => setPrompt(e.target.value), placeholder: "Enter prompt..." }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSendPrompt, disabled: !selectedAgent || !prompt, children: "Send" })] }), (0, jsx_runtime_1.jsxs)("section", { className: "task-queue", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Task Queue" }), (0, jsx_runtime_1.jsx)("div", { className: "task-list", children: tasks.map(task => ((0, jsx_runtime_1.jsxs)("div", { className: `task-item ${task.status} ${selectedTask?.id === task.id ? 'selected' : ''}`, onClick: () => setSelectedTask(task), children: [(0, jsx_runtime_1.jsxs)("div", { className: "task-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "task-type", children: task.type }), (0, jsx_runtime_1.jsx)("span", { className: "task-status", children: task.status })] }), task.duration && ((0, jsx_runtime_1.jsxs)("span", { className: "task-duration", children: [Math.round(task.duration / 1000), "s"] })), task.error && ((0, jsx_runtime_1.jsx)("span", { className: "task-error", children: task.error }))] }, task.id))) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "budget-panel", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Budget" }), (0, jsx_runtime_1.jsxs)("div", { className: "budget-info", children: [(0, jsx_runtime_1.jsxs)("div", { className: "budget-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "CPU Usage:" }), (0, jsx_runtime_1.jsxs)("span", { className: "value", children: [budget.cpuUsed.toFixed(1), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "budget-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Remote Calls:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: budget.remoteCalls })] })] })] }), (0, jsx_runtime_1.jsx)(SettingsPanel_1.default, { loopInterval: loopInterval, looping: looping, debugMode: debugMode, onLoopIntervalChange: handleLoopIntervalChange, onLoopingChange: handleLoopingChange, onDebugModeChange: handleDebugModeChange }), (0, jsx_runtime_1.jsx)(TaskDetailPanel_1.TaskDetailPanel, { task: selectedTask, onCancel: onCancelTask, onBoostPriority: onBoostPriority, onDuplicate: onDuplicateTask }), buildOptimizerManifest_1.buildOptimizerManifest.DevOverlays === 'core' ? ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)("div", { children: "Loading Dev Overlays..." }), children: (0, jsx_runtime_1.jsx)(DevOverlays, {}) })) : ((0, jsx_runtime_1.jsx)("div", { style: { opacity: 0.5, fontStyle: 'italic' }, children: "Dev Overlays not loaded (not core)" })), FEATURE_FLAGS_1.FEATURES.SR_DRIFT_TRACKER ? ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)("div", { children: "Loading Drift Simulator..." }), children: (0, jsx_runtime_1.jsx)(DriftSimulator, {}) })) : ((0, jsx_runtime_1.jsx)("div", { style: { opacity: 0.5, fontStyle: 'italic' }, children: "Drift Simulator disabled" }))] }))] }));
};
exports.AgentConsoleSidebar = AgentConsoleSidebar;
//# sourceMappingURL=AgentConsoleSidebar.js.map