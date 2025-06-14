"use strict";
// MCP Task Commands
// This file defines MCP task commands for the RedQueen Agent Console
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpTaskCommands = void 0;
const FEATURE_FLAGS_1 = require("../config/FEATURE_FLAGS");
exports.mcpTaskCommands = {
    'run.cloudTest': (taskName) => {
        if (!FEATURE_FLAGS_1.FEATURES.MCP_TASK_QUEUE) {
            return 'Task queue is disabled.';
        }
        // Stub: Integrate with cloud test infra here
        return `Cloud test for task: ${taskName} (stub)`;
    },
    // Add more MCP commands here
};
//# sourceMappingURL=taskCommands.js.map