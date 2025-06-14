import { createRoot } from "react-dom/client";
import { AgentTask, BudgetLimits } from '../agentTaskManager';
import { AgentConsoleSidebar } from "./AgentConsoleSidebar";

const root = createRoot(document.getElementById("root")!);

// Define missing variables with proper types
const taskManager = {
  enqueue: async (task: Omit<AgentTask, "id" | "status" | "startTime">) => '',
  onTaskUpdate: (callback: (task: AgentTask) => void) => () => {},
  budgetTracker: {
    onBudgetUpdate: (callback: (budget: { cpuUsed: number; remoteCalls: number }) => void) => () => {},
  },
};

const budgetLimits: BudgetLimits = {
  maxCpuUsage: 100,
  maxRemoteCalls: 100,
  maxMemoryUsage: 100,
  maxConcurrentTasks: 10,
};

const tasks: AgentTask[] = []; // Replace with actual tasks array

const onCancelTask = (id: string) => {}; // Replace with actual onCancelTask function
const onTaskComplete = (id: string) => {}; // Replace with actual onTaskComplete function

root.render(
  <AgentConsoleSidebar
    taskManager={taskManager}
    budgetLimits={budgetLimits}
    tasks={tasks}
    onCancelTask={onCancelTask}
    onBoostPriority={(id: string) => {}}
    onDuplicateTask={(task: AgentTask) => {}}
  />
);
