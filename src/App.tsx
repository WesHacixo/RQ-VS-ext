import React, { useEffect, useState } from 'react';
import { AgentTask, AgentTaskManager, BudgetLimits, TaskPriority } from './agentTaskManager';
import { FeatureFlags, setFeatureFlags } from './featureFlags';
import { AgentConsoleSidebar } from './ui/AgentConsoleSidebar';
import { logMessage } from './utils/logBridge';

const budgetLimits: BudgetLimits = {
  maxCpuUsage: 80,
  maxRemoteCalls: 100,
  maxMemoryUsage: 1024,
  maxConcurrentTasks: 5
};

const taskManager = new AgentTaskManager(budgetLimits);

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>({
    enableAdvancedTaskTypes: false,
    enableTaskDuplication: false,
    enablePriorityBoosting: false
  });

  useEffect(() => {
    // Example: Create some initial tasks
    const initialTasks = [
      taskManager.createTask('run_terminal', TaskPriority.Normal),
      taskManager.createTask('edit_file', TaskPriority.Low),
      taskManager.createTask('search_workspace', TaskPriority.High)
    ];

    setTasks(initialTasks);

    // Set up task updates
    const interval = setInterval(() => {
      setTasks(taskManager.getTasks());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelTask = (taskId: string) => {
    taskManager.cancelTask(taskId);
    setTasks(taskManager.getTasks());
  };

  const handleBoostPriority = (taskId: string) => {
    try {
      taskManager.boostPriority(taskId);
      setTasks(taskManager.getTasks());
    } catch (error) {
      logMessage('error', error instanceof Error ? error.message : 'Failed to boost priority');
    }
  };

  const handleDuplicateTask = (task: AgentTask) => {
    try {
      const newTask = taskManager.duplicateTask(task);
      setTasks(taskManager.getTasks());
      logMessage('info', `Duplicated task: ${newTask.id}`);
    } catch (error) {
      logMessage('error', error instanceof Error ? error.message : 'Failed to duplicate task');
    }
  };

  const handleToggleFeature = (feature: keyof FeatureFlags) => {
    const newFlags = {
      ...featureFlags,
      [feature]: !featureFlags[feature]
    };
    setFeatureFlagsState(newFlags);
    setFeatureFlags(newFlags);
    logMessage('info', `Toggled feature ${feature}: ${newFlags[feature]}`);
  };

  return (
    <div className="app">
      <div className="feature-flags">
        <h3>Feature Flags</h3>
        <div className="flag-toggles">
          <label>
            <input
              type="checkbox"
              checked={featureFlags.enableAdvancedTaskTypes}
              onChange={() => handleToggleFeature('enableAdvancedTaskTypes')}
            />
            Enable Advanced Task Types
          </label>
          <label>
            <input
              type="checkbox"
              checked={featureFlags.enableTaskDuplication}
              onChange={() => handleToggleFeature('enableTaskDuplication')}
            />
            Enable Task Duplication
          </label>
          <label>
            <input
              type="checkbox"
              checked={featureFlags.enablePriorityBoosting}
              onChange={() => handleToggleFeature('enablePriorityBoosting')}
            />
            Enable Priority Boosting
          </label>
        </div>
      </div>

      <AgentConsoleSidebar
        taskManager={{
          enqueue: async (task) => {
            const taskId = await taskManager.enqueue(task);
            return taskId;
          },
          onTaskUpdate: (callback) => {
            taskManager.onTaskUpdate(callback);
            return () => {}; // Cleanup function
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
        }}
        budgetLimits={budgetLimits}
        tasks={tasks}
        onCancelTask={handleCancelTask}
        onBoostPriority={handleBoostPriority}
        onDuplicateTask={handleDuplicateTask}
      />
    </div>
  );
};
