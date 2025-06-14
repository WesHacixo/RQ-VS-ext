"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
const AgentConsoleSidebar_1 = require("./AgentConsoleSidebar");
const root = (0, client_1.createRoot)(document.getElementById("root"));
// Define missing variables with proper types
const taskManager = {
    enqueue: async (task) => '',
    onTaskUpdate: (callback) => () => { },
    budgetTracker: {
        onBudgetUpdate: (callback) => () => { },
    },
};
const budgetLimits = {
    maxCpuUsage: 100,
    maxRemoteCalls: 100,
    maxMemoryUsage: 100,
    maxConcurrentTasks: 10,
};
const tasks = []; // Replace with actual tasks array
const onCancelTask = (id) => { }; // Replace with actual onCancelTask function
const onTaskComplete = (id) => { }; // Replace with actual onTaskComplete function
root.render((0, jsx_runtime_1.jsx)(AgentConsoleSidebar_1.AgentConsoleSidebar, { taskManager: taskManager, budgetLimits: budgetLimits, tasks: tasks, onCancelTask: onCancelTask, onBoostPriority: (id) => { }, onDuplicateTask: (task) => { } }));
//# sourceMappingURL=agentConsoleWebview.js.map