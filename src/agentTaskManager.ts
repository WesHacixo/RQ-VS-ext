import { EventEmitter } from 'vscode';
import { isFeatureEnabled } from './featureFlags';
import { logMessage } from './utils/logBridge';

export enum TaskPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high'
}

export interface AgentTask {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: TaskPriority;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  agentId?: string;
  metadata: {
    parameters?: Record<string, any>;
    result?: any;
  };
}

export interface BudgetLimits {
  maxCpuUsage: number;
  maxRemoteCalls: number;
  maxMemoryUsage: number;
  maxConcurrentTasks: number;
}

export interface TaskType {
  label: string;
  description: string;
  category: string;
  estimatedCost: number;
}

export class AgentTaskManager {
  private tasks: Map<string, AgentTask>;
  private taskQueue: string[];
  private runningTasks: Set<string>;
  private taskTypes: Map<string, TaskType>;
  private eventEmitter: EventEmitter<AgentTask>;
  private budgetLimits: BudgetLimits;
  private currentCpuUsage: number;
  private currentRemoteCalls: number;
  private currentMemoryUsage: number;

  constructor(budgetLimits: BudgetLimits) {
    this.tasks = new Map();
    this.taskQueue = [];
    this.runningTasks = new Set();
    this.taskTypes = new Map();
    this.eventEmitter = new EventEmitter<AgentTask>();
    this.budgetLimits = budgetLimits;
    this.currentCpuUsage = 0;
    this.currentRemoteCalls = 0;
    this.currentMemoryUsage = 0;
    this.initializeTaskTypes();
  }

  private checkBudgetLimits(): boolean {
    if (this.currentCpuUsage > this.budgetLimits.maxCpuUsage ||
        this.currentRemoteCalls > this.budgetLimits.maxRemoteCalls ||
        this.currentMemoryUsage > this.budgetLimits.maxMemoryUsage ||
        this.runningTasks.size >= this.budgetLimits.maxConcurrentTasks) {
      logMessage('warn', 'Budget limits exceeded', {
        cpu: this.currentCpuUsage,
        remoteCalls: this.currentRemoteCalls,
        memory: this.currentMemoryUsage,
        runningTasks: this.runningTasks.size
      });
      return false;
    }
    return true;
  }

  private initializeTaskTypes() {
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
    if (isFeatureEnabled('enableAdvancedTaskTypes')) {
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

  public registerTaskType(type: string, config: TaskType) {
    this.taskTypes.set(type, config);
  }

  public async enqueue(task: Omit<AgentTask, 'id' | 'status' | 'startTime'>): Promise<string> {
    if (!this.checkBudgetLimits()) {
      throw new Error('Budget limits exceeded');
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: AgentTask = {
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

  public createTask(
    type: string,
    priority: TaskPriority = TaskPriority.Normal,
    agentId?: string,
    parameters?: Record<string, any>
  ): AgentTask {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: AgentTask = {
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

  public getTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  public getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'failed';
      task.error = 'Task cancelled';
      this.taskQueue = this.taskQueue.filter(id => id !== taskId);
      this.eventEmitter.fire(task);
    }
  }

  public boostPriority(taskId: string): void {
    if (!isFeatureEnabled('enablePriorityBoosting')) {
      throw new Error('Priority boosting is not enabled');
    }

    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending') {return;}

    task.priority = TaskPriority.High;
    this.taskQueue = [
      taskId,
      ...this.taskQueue.filter(id => id !== taskId)
    ];
    this.eventEmitter.fire(task);
  }

  public duplicateTask(task: AgentTask): AgentTask {
    if (!isFeatureEnabled('enableTaskDuplication')) {
      throw new Error('Task duplication is not enabled');
    }

    return this.createTask(
      task.type,
      task.priority,
      task.agentId,
      task.metadata.parameters
    );
  }

  public onTaskUpdate(callback: (task: AgentTask) => void): void {
    this.eventEmitter.event(callback);
  }

  public getBudgetStatus(): {
    cpuUsed: number;
    remoteCalls: number;
    memoryUsed: number;
    runningTasks: number;
  } {
    return {
      cpuUsed: this.currentCpuUsage,
      remoteCalls: this.currentRemoteCalls,
      memoryUsed: this.currentMemoryUsage,
      runningTasks: this.runningTasks.size
    };
  }
}
