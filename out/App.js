"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const agentTaskManager_1 = require("./agentTaskManager");
const featureFlags_1 = require("./featureFlags");
const AgentConsoleSidebar_1 = require("./ui/AgentConsoleSidebar");
const logBridge_1 = require("./utils/logBridge");
const budgetLimits = {
    maxCpuUsage: 80,
    maxRemoteCalls: 100,
    maxMemoryUsage: 1024,
    maxConcurrentTasks: 5
};
const taskManager = new agentTaskManager_1.AgentTaskManager(budgetLimits);
const App = () => {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const [featureFlags, setFeatureFlagsState] = (0, react_1.useState)({
        enableAdvancedTaskTypes: false,
        enableTaskDuplication: false,
        enablePriorityBoosting: false
    });
    (0, react_1.useEffect)(() => {
        // Example: Create some initial tasks
        const initialTasks = [
            taskManager.createTask('run_terminal', agentTaskManager_1.TaskPriority.Normal),
            taskManager.createTask('edit_file', agentTaskManager_1.TaskPriority.Low),
            taskManager.createTask('search_workspace', agentTaskManager_1.TaskPriority.High)
        ];
        setTasks(initialTasks);
        // Set up task updates
        const interval = setInterval(() => {
            setTasks(taskManager.getTasks());
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const handleCancelTask = (taskId) => {
        taskManager.cancelTask(taskId);
        setTasks(taskManager.getTasks());
    };
    const handleBoostPriority = (taskId) => {
        try {
            taskManager.boostPriority(taskId);
            setTasks(taskManager.getTasks());
        }
        catch (error) {
            (0, logBridge_1.logMessage)('error', error instanceof Error ? error.message : 'Failed to boost priority');
        }
    };
    const handleDuplicateTask = (task) => {
        try {
            const newTask = taskManager.duplicateTask(task);
            setTasks(taskManager.getTasks());
            (0, logBridge_1.logMessage)('info', `Duplicated task: ${newTask.id}`);
        }
        catch (error) {
            (0, logBridge_1.logMessage)('error', error instanceof Error ? error.message : 'Failed to duplicate task');
        }
    };
    const handleToggleFeature = (feature) => {
        const newFlags = {
            ...featureFlags,
            [feature]: !featureFlags[feature]
        };
        setFeatureFlagsState(newFlags);
        (0, featureFlags_1.setFeatureFlags)(newFlags);
        (0, logBridge_1.logMessage)('info', `Toggled feature ${feature}: ${newFlags[feature]}`);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app", children: [(0, jsx_runtime_1.jsxs)("div", { className: "feature-flags", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Feature Flags" }), (0, jsx_runtime_1.jsxs)("div", { className: "flag-toggles", children: [(0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: featureFlags.enableAdvancedTaskTypes, onChange: () => handleToggleFeature('enableAdvancedTaskTypes') }), "Enable Advanced Task Types"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: featureFlags.enableTaskDuplication, onChange: () => handleToggleFeature('enableTaskDuplication') }), "Enable Task Duplication"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: featureFlags.enablePriorityBoosting, onChange: () => handleToggleFeature('enablePriorityBoosting') }), "Enable Priority Boosting"] })] })] }), (0, jsx_runtime_1.jsx)(AgentConsoleSidebar_1.AgentConsoleSidebar, { taskManager: {
                    enqueue: async (task) => {
                        const taskId = await taskManager.enqueue(task);
                        return taskId;
                    },
                    onTaskUpdate: (callback) => {
                        taskManager.onTaskUpdate(callback);
                        return () => { }; // Cleanup function
                    },
                    budgetTracker: {
                        onBudgetUpdate: (callback) => {
                            const interval = setInterval(() => {
                                const status = taskManager.getBudgetStatus();
                                callback({
                                    cpuUsed: status.cpuUsed,
                                    remoteCalls: status.remoteCalls
                                });
                            }, 1000);
                            return () => clearInterval(interval);
                        }
                    }
                }, budgetLimits: budgetLimits, tasks: tasks, onCancelTask: handleCancelTask, onBoostPriority: handleBoostPriority, onDuplicateTask: handleDuplicateTask })] }));
};
exports.App = App;
//# sourceMappingURL=App.js.map