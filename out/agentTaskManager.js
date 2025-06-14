"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTaskManager = exports.TaskPriority = void 0;
const vscode_1 = require("vscode");
const featureFlags_1 = require("./featureFlags");
const logBridge_1 = require("./utils/logBridge");
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["Low"] = "low";
    TaskPriority["Normal"] = "normal";
    TaskPriority["High"] = "high";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class AgentTaskManager {
    constructor(budgetLimits) {
        this.tasks = new Map();
        this.taskQueue = [];
        this.runningTasks = new Set();
        this.taskTypes = new Map();
        this.eventEmitter = new vscode_1.EventEmitter();
        this.budgetLimits = budgetLimits;
        this.currentCpuUsage = 0;
        this.currentRemoteCalls = 0;
        this.currentMemoryUsage = 0;
        this.initializeTaskTypes();
    }
    checkBudgetLimits() {
        if (this.currentCpuUsage > this.budgetLimits.maxCpuUsage ||
            this.currentRemoteCalls > this.budgetLimits.maxRemoteCalls ||
            this.currentMemoryUsage > this.budgetLimits.maxMemoryUsage ||
            this.runningTasks.size >= this.budgetLimits.maxConcurrentTasks) {
            (0, logBridge_1.logMessage)('warn', 'Budget limits exceeded', {
                cpu: this.currentCpuUsage,
                remoteCalls: this.currentRemoteCalls,
                memory: this.currentMemoryUsage,
                runningTasks: this.runningTasks.size
            });
            return false;
        }
        return true;
    }
    initializeTaskTypes() {
        // Basic task types (always available)
        this.registerTaskType('run_terminal', {
            label: 'Run Terminal Command',
            description: 'Execute a terminal command',
            category: 'system',
            estimatedCost: 1
        });
        this.registerTaskType('edit_file', {
            label: 'Edit File',
            description: 'Edit a file in the workspace',
            category: 'system',
            estimatedCost: 1
        });
        this.registerTaskType('search_workspace', {
            label: 'Search Workspace',
            description: 'Search files by name or content',
            category: 'system',
            estimatedCost: 1
        });
        // Advanced task types (behind feature flag)
        if ((0, featureFlags_1.isFeatureEnabled)('enableAdvancedTaskTypes')) {
            this.registerTaskType('analyze.sr.drift', {
                label: 'Analyze SR Drift',
                description: 'Analyze SR drift patterns in agent behavior',
                category: 'analysis',
                estimatedCost: 3
            });
            this.registerTaskType('scan.imf.patterns', {
                label: 'Scan IMF Patterns',
                description: 'Scan for IMF patterns in agent memory',
                category: 'analysis',
                estimatedCost: 2
            });
            this.registerTaskType('sync.cache.to.remote', {
                label: 'Sync Cache to Remote',
                description: 'Synchronize agent cache with remote storage',
                category: 'sync',
                estimatedCost: 2
            });
            this.registerTaskType('refactor.agent.module', {
                label: 'Refactor Agent Module',
                description: 'Refactor agent module for improved performance',
                category: 'refactor',
                estimatedCost: 4
            });
            this.registerTaskType('test.agent.selfloop', {
                label: 'Test Agent Self-Loop',
                description: 'Test agent self-loop functionality',
                category: 'test',
                estimatedCost: 1
            });
        }
    }
    registerTaskType(type, config) {
        this.taskTypes.set(type, config);
    }
    async enqueue(task) {
        if (!this.checkBudgetLimits()) {
            throw new Error('Budget limits exceeded');
        }
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTask = {
            ...task,
            id: taskId,
            status: 'pending',
            startTime: Date.now()
        };
        this.tasks.set(taskId, newTask);
        this.taskQueue.push(taskId);
        this.eventEmitter.fire(newTask);
        return taskId;
    }
    createTask(type, priority = TaskPriority.Normal, agentId, parameters) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task = {
            id: taskId,
            type,
            status: 'pending',
            priority,
            startTime: Date.now(),
            agentId,
            metadata: { parameters }
        };
        this.tasks.set(taskId, task);
        this.taskQueue.push(taskId);
        this.eventEmitter.fire(task);
        return task;
    }
    getTasks() {
        return Array.from(this.tasks.values());
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    cancelTask(taskId) {
        const task = this.tasks.get(taskId);
        if (task && task.status === 'pending') {
            task.status = 'failed';
            task.error = 'Task cancelled';
            this.taskQueue = this.taskQueue.filter(id => id !== taskId);
            this.eventEmitter.fire(task);
        }
    }
    boostPriority(taskId) {
        if (!(0, featureFlags_1.isFeatureEnabled)('enablePriorityBoosting')) {
            throw new Error('Priority boosting is not enabled');
        }
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'pending') {
            return;
        }
        task.priority = TaskPriority.High;
        this.taskQueue = [
            taskId,
            ...this.taskQueue.filter(id => id !== taskId)
        ];
        this.eventEmitter.fire(task);
    }
    duplicateTask(task) {
        if (!(0, featureFlags_1.isFeatureEnabled)('enableTaskDuplication')) {
            throw new Error('Task duplication is not enabled');
        }
        return this.createTask(task.type, task.priority, task.agentId, task.metadata.parameters);
    }
    onTaskUpdate(callback) {
        this.eventEmitter.event(callback);
    }
    getBudgetStatus() {
        return {
            cpuUsed: this.currentCpuUsage,
            remoteCalls: this.currentRemoteCalls,
            memoryUsed: this.currentMemoryUsage,
            runningTasks: this.runningTasks.size
        };
    }
}
exports.AgentTaskManager = AgentTaskManager;
//# sourceMappingURL=agentTaskManager.js.map