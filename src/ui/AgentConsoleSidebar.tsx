import Chart from 'chart.js/auto';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { AgentTask, BudgetLimits } from '../agentTaskManager';
import { buildOptimizerManifest } from '../config/buildOptimizerManifest';
import { FEATURES } from '../config/FEATURE_FLAGS';
import './AgentConsoleSidebar.css';
import SettingsPanel from './SettingsPanel';
import { TaskDetailPanel } from './TaskDetailPanel';

// Add this at the top of the file for VS Code webview API typing
declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
  }
}

// --- Types (from Spec) ---
export type AgentConsoleOutbound =
  | { type: "TOGGLE_AGENT"; agentId: string; enabled: boolean }
  | { type: "SEND_PROMPT"; agentId: string; prompt: string }
  | { type: "FETCH_SR_METRICS" }
  | { type: "RECOMPUTE_SR"; agentId?: string }
  | { type: "FETCH_IMF_SUMMARY"; agentId?: string }
  | { type: "FETCH_ACTIVE_AGENTS" }
  | { type: "FETCH_CONCEPT_TOKENS"; agentId?: string }
  | { type: "SETTINGS_UPDATE"; data: { loopInterval: number; looping: boolean; debugMode: boolean } };

export type AgentConsoleInbound =
  | { type: "SR_METRICS"; data: SRMetrics }
  | { type: "IMF_SUMMARY"; data: IMFTagSummary }
  | { type: "ACTIVE_AGENTS"; data: AgentInfo[] }
  | { type: "CONCEPT_TOKENS"; data: ConceptToken[] }
  | { type: "AGENT_STATUS"; agentId: string; enabled: boolean }
  | { type: "ERROR"; message: string }
  | { type: "SETTINGS_SYNC"; data: { loopInterval: number; looping: boolean; debugMode: boolean } };

export interface SRMetrics {
  agentId: string;
  siglenceRatio: number;
  deltaSR: number;
  lsd: number;
  sae: number;
  mcr: number;
  timestamp: string;
}

export interface IMFTagSummary {
  agentId: string;
  tags: { [tag: string]: string | number };
}

export interface AgentInfo {
  id: string;
  name: string;
  status: "active" | "idle" | "disabled";
}

export interface ConceptToken {
  id: string;
  label: string;
  type: string;
  value: string;
}

// --- MessageBridge Hook ---
function useMessageBridge(onMessage: (msg: AgentConsoleInbound) => void) {
  const postMessage = (msg: AgentConsoleOutbound) => {
    if (window.acquireVsCodeApi) {
      const vscode = window.acquireVsCodeApi();
      vscode.postMessage(msg);
    } else {
      window.parent.postMessage(msg, "*");
    }
  };
  useEffect(() => {
    const handler = (event: MessageEvent) => {
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
function getMessageType(log: string): string {
  const match = log.match(/\b(SR_METRICS|IMF_SUMMARY|AGENT_STATUS|ACTIVE_AGENTS|CONCEPT_TOKENS|ERROR|TOGGLE_AGENT|SEND_PROMPT|RECOMPUTE_SR|FETCH_\w+)\b/);
  return match ? match[1] : "OTHER";
}

// --- Helper: Format SR metrics for display ---
const formatMetricValue = (value: number): string => {
  return (value * 100).toFixed(1) + '%';
};

const getMetricTrend = (current: number, previous: number): string => {
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) {return '→';}
  return diff > 0 ? '↑' : '↓';
};

const getMetricColor = (value: number): string => {
  if (value >= 0.8) {return '#4caf50';}  // Good (green)
  if (value >= 0.6) {return '#ff9800';}  // Warning (orange)
  return '#f44336';  // Poor (red)
};

// --- SR Metric Card Component ---
interface MetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  tooltip: string;
  debugMode: boolean;
  timestamp: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, previousValue, tooltip, debugMode, timestamp }) => (
  <div className="metric-card" title={debugMode ? `SR: ${value} @ ${timestamp}` : undefined} style={{
    padding: '8px',
    margin: '4px',
    borderRadius: '4px',
    backgroundColor: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-widget-border)'
  }}>
    <div style={{ fontSize: '0.9em', color: 'var(--vscode-descriptionForeground)' }}>{label}</div>
    <div style={{
      fontSize: '1.2em',
      color: getMetricColor(value),
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {formatMetricValue(value)}
      {previousValue && (
        <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
          {getMetricTrend(value, previousValue)}
        </span>
      )}
    </div>
  </div>
);

// --- System Status Panel ---
const getStatus = (srMetrics: SRMetrics | null, error: string | null) => {
  if (error) {return { label: 'Error', color: '#f44336', tooltip: error };}
  if (!srMetrics || isNaN(srMetrics.siglenceRatio)) {return { label: 'Waiting', color: '#ff9800', tooltip: 'Waiting for SR metrics from backend.' };}
  return { label: 'Ready', color: '#4caf50', tooltip: `SR: ${(srMetrics.siglenceRatio * 100).toFixed(1)}% | Last updated: ${srMetrics.timestamp}` };
};

// --- SR Drift Tracker State ---
const [srHistory, setSRHistory] = useState<Record<string, { timestamp: string, sr: number }[]>>({});

// --- SR Drift Chart with Chart.js ---
const [chartZoom, setChartZoom] = useState(1);
const chartRef = useRef<any>(null);
const SRDriftChart: React.FC<{ history: { timestamp: string, sr: number }[], zoom: number, onRef?: (chart: any) => void }> = ({ history, zoom, onRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !history.length) {return;}
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {return;}
    const displayHistory = zoom < 1 ? history : history.slice(-Math.max(2, Math.round(history.length * zoom)));
    const chart = new Chart(ctx, {
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
    if (onRef) {onRef(chart);}
    return () => { chart.destroy(); };
  }, [history, zoom]);
  return <canvas ref={canvasRef} width={220} height={60} style={{ background: '#222', borderRadius: 4 }} />;
};

// --- Main Sidebar Component ---
interface AgentConsoleSidebarProps {
  taskManager: {
    enqueue: (task: Omit<AgentTask, 'id' | 'status' | 'startTime'>) => Promise<string>;
    onTaskUpdate: (callback: (task: AgentTask) => void) => () => void;
    budgetTracker: {
      onBudgetUpdate: (callback: (budget: { cpuUsed: number; remoteCalls: number }) => void) => () => void;
    };
  };
  budgetLimits: BudgetLimits;
  tasks: AgentTask[];
  onCancelTask: (taskId: string) => void;
  onBoostPriority: (taskId: string) => void;
  onDuplicateTask: (task: AgentTask) => void;
}

// Lazy load dev overlays and drift simulator
const DevOverlays = React.lazy(() => import('./DevOverlays'));
const DriftSimulator = React.lazy(() => import('./DriftSimulator'));

export const AgentConsoleSidebar: React.FC<AgentConsoleSidebarProps> = ({
  taskManager,
  budgetLimits,
  tasks,
  onCancelTask,
  onBoostPriority,
  onDuplicateTask
}) => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [srMetrics, setSRMetrics] = useState<SRMetrics | null>(null);
  const [imfSummary, setIMFSummary] = useState<IMFTagSummary | null>(null);
  const [conceptTokens, setConceptTokens] = useState<ConceptToken[]>([]);
  const [theme, setTheme] = useState<"BlueHand" | "REDCODE">("BlueHand");
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [logs, setLogs] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('agentConsoleLogs');
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    }
    return [];
  });
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [budget, setBudget] = useState<{ cpuUsed: number; remoteCalls: number }>({ cpuUsed: 0, remoteCalls: 0 });
  const logRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loopInterval, setLoopInterval] = useState(5000);
  const [looping, setLooping] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // --- LogBridge Filters ---
  const logTypes = ['ALL', 'INBOUND', 'OUTBOUND', 'ERROR'];
  const [logTypeFilter, setLogTypeFilter] = useState<string>(() => window.localStorage?.getItem('logTypeFilter') || 'ALL');
  useEffect(() => { window.localStorage?.setItem('logTypeFilter', logTypeFilter); }, [logTypeFilter]);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const handleExportLogs = async (format: 'json' | 'md') => {
    if (format === 'json') {
      const data = JSON.stringify(logs, null, 2);
      if (window.acquireVsCodeApi) {
        const vscode = window.acquireVsCodeApi();
        vscode.postMessage({ type: 'EXPORT_LOGS', format: 'json', data });
        setExportMsg('Exported logs to agent-console-logs.json');
        setTimeout(() => setExportMsg(null), 3000);
      } else {
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
    } else {
      setExportMsg('Markdown export not implemented yet.');
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  // --- LogBridge ---
  const logMessage = (level: string, message: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
    setLogs(l => {
      const updated = [...l, entry];
      if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.setItem('agentConsoleLogs', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // --- Log Filtering ---
  const filteredLogs = logs.filter(log => {
    if (logTypeFilter === 'ALL') {return true;}
    if (logTypeFilter === 'INBOUND') {return log.includes('Inbound');}
    if (logTypeFilter === 'OUTBOUND') {return log.includes('Outbound');}
    if (logTypeFilter === 'ERROR') {return log.includes('ERROR');}
    return true;
  });

  // --- Expand/Collapse ---
  const toggleExpand = (idx: number) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {next.delete(idx);} else {next.add(idx);}
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
  useEffect(() => {
    postMessage({ type: "FETCH_ACTIVE_AGENTS" });
    postMessage({ type: "FETCH_SR_METRICS" });
    postMessage({ type: "FETCH_IMF_SUMMARY" });
    postMessage({ type: "FETCH_CONCEPT_TOKENS" });
  }, []);

  // --- Panel Handlers (with logging) ---
  const handleToggleAgent = (id: string, enabled: boolean) => {
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
  const handleLoopIntervalChange = (val: number) => {
    setLoopInterval(val);
    postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval: val, looping, debugMode } });
    logMessage('info', 'Loop interval changed');
  };

  const handleLoopingChange = (val: boolean) => {
    setLooping(val);
    postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval, looping: val, debugMode } });
    logMessage('info', 'Looping changed');
  };

  const handleDebugModeChange = (val: boolean) => {
    setDebugMode(val);
    postMessage({ type: 'SETTINGS_UPDATE', data: { loopInterval, looping, debugMode: val } });
    logMessage('info', 'Debug mode changed');
  };

  // Add task update handler
  useEffect(() => {
    const handleTaskUpdate = (task: AgentTask) => {
      // This is a placeholder implementation. You might want to update the state
      // to reflect the changes in the task list.
    };

    const handleBudgetUpdate = (budget: { cpuUsed: number; remoteCalls: number }) => {
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
  return (
    <div className={`agent-console-sidebar theme-${theme.toLowerCase()} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2>Agent Console</h2>
        <button
          className="toggle-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '←' : '→'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="control-buttons">
            <button onClick={handleThemeSwitch}>Switch Theme</button>
          </div>

          {/* LogBridge Filters */}
          <div className="log-filters">
            {logTypes.map(type => (
              <button
                key={type}
                onClick={() => setLogTypeFilter(type)}
                className={logTypeFilter === type ? 'active' : ''}
              >
                {type}
              </button>
            ))}
            <button onClick={() => handleExportLogs('json')}>Export JSON</button>
            <button onClick={() => handleExportLogs('md')}>Export MD</button>
            {exportMsg && <span className="export-message">{exportMsg}</span>}
          </div>

          {/* Active Agents Panel */}
          <section className="agents-panel">
            <h3>Active Agents</h3>
            <ul>
              {agents.map(agent => (
                <li key={agent.id}>
                  <span>{agent.name} ({agent.status})</span>
                  <button onClick={() => handleToggleAgent(agent.id, agent.status !== "active")}>
                    {agent.status === "active" ? "Disable" : "Enable"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Prompt Builder Panel */}
          <section className="prompt-panel">
            <h3>Prompt Builder</h3>
            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
              <option value="">Select Agent</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter prompt..."
            />
            <button
              onClick={handleSendPrompt}
              disabled={!selectedAgent || !prompt}
            >
              Send
            </button>
          </section>

          {/* Task Queue Panel */}
          <section className="task-queue">
            <h3>Task Queue</h3>
            <div className="task-list">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`task-item ${task.status} ${selectedTask?.id === task.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-header">
                    <span className="task-type">{task.type}</span>
                    <span className="task-status">{task.status}</span>
                  </div>
                  {task.duration && (
                    <span className="task-duration">
                      {Math.round(task.duration / 1000)}s
                    </span>
                  )}
                  {task.error && (
                    <span className="task-error">{task.error}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Budget Panel */}
          <section className="budget-panel">
            <h3>Budget</h3>
            <div className="budget-info">
              <div className="budget-item">
                <span className="label">CPU Usage:</span>
                <span className="value">{budget.cpuUsed.toFixed(1)}%</span>
              </div>
              <div className="budget-item">
                <span className="label">Remote Calls:</span>
                <span className="value">{budget.remoteCalls}</span>
              </div>
            </div>
          </section>

          {/* Settings Panel */}
          <SettingsPanel
            loopInterval={loopInterval}
            looping={looping}
            debugMode={debugMode}
            onLoopIntervalChange={handleLoopIntervalChange}
            onLoopingChange={handleLoopingChange}
            onDebugModeChange={handleDebugModeChange}
          />

          {/* Task Detail Panel */}
          <TaskDetailPanel
            task={selectedTask}
            onCancel={onCancelTask}
            onBoostPriority={onBoostPriority}
            onDuplicate={onDuplicateTask}
          />

          {/* Dev Overlays */}
          {buildOptimizerManifest.DevOverlays === 'core' ? (
            <Suspense fallback={<div>Loading Dev Overlays...</div>}>
              <DevOverlays />
            </Suspense>
          ) : (
            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Dev Overlays not loaded (not core)</div>
          )}
          {FEATURES.SR_DRIFT_TRACKER ? (
            <Suspense fallback={<div>Loading Drift Simulator...</div>}>
              <DriftSimulator />
            </Suspense>
          ) : (
            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Drift Simulator disabled</div>
          )}
        </>
      )}
    </div>
  );
};
