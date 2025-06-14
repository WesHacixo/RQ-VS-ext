"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDetailPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const agentTaskManager_1 = require("../agentTaskManager");
const TaskDetailPanel = ({ task, onCancel, onBoostPriority, onDuplicate }) => {
    if (!task) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "task-detail-panel", children: (0, jsx_runtime_1.jsx)("div", { className: "no-task-selected", children: "Select a task to view details" }) }));
    }
    const formatDuration = (ms) => {
        const seconds = Math.round(ms / 1000);
        if (seconds < 60)
            return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#ffd700';
            case 'running': return '#4caf50';
            case 'done': return '#2196f3';
            case 'error': return '#f44336';
            default: return '#888';
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case agentTaskManager_1.TaskPriority.High: return '#f44336';
            case agentTaskManager_1.TaskPriority.Normal: return '#4caf50';
            case agentTaskManager_1.TaskPriority.Low: return '#2196f3';
            default: return '#888';
        }
    };
    const metadata = task.metadata;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "task-detail-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "task-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: metadata.label ?? 'No Label' }), (0, jsx_runtime_1.jsx)("span", { className: "task-status", style: { backgroundColor: getStatusColor(task.status) }, children: task.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "task-info", children: [(0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Type:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: task.type })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Priority:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", style: { color: getPriorityColor(task.priority) }, children: task.priority })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Category:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: metadata.category ?? 'N/A' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Agent:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: task.agentId || 'None' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Started:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: new Date(task.startTime).toLocaleTimeString() })] }), task.duration && ((0, jsx_runtime_1.jsxs)("div", { className: "info-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Duration:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: formatDuration(task.duration) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "task-description", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Description" }), (0, jsx_runtime_1.jsx)("p", { children: metadata.description ?? 'No description' })] }), task.error && ((0, jsx_runtime_1.jsxs)("div", { className: "task-error", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Error" }), (0, jsx_runtime_1.jsx)("p", { children: task.error })] })), (0, jsx_runtime_1.jsxs)("div", { className: "task-actions", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => onCancel(task.id), disabled: task.status !== 'pending' && task.status !== 'running', className: "action-button cancel", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => onBoostPriority(task.id), disabled: task.priority === agentTaskManager_1.TaskPriority.High || task.status !== 'pending', className: "action-button boost", children: "Boost Priority" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => onDuplicate(task), className: "action-button duplicate", children: "Duplicate" })] })] }));
};
exports.TaskDetailPanel = TaskDetailPanel;
//# sourceMappingURL=TaskDetailPanel.js.map