import React from 'react';
import { AgentTask, TaskPriority } from '../agentTaskManager';

interface TaskMetadata {
  label: string;
  category: string;
  description: string;
  parameters?: Record<string, any>;
  result?: any;
}

interface TaskDetailPanelProps {
  task: AgentTask | null;
  onCancel: (taskId: string) => void;
  onBoostPriority: (taskId: string) => void;
  onDuplicate: (task: AgentTask) => void;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  onCancel,
  onBoostPriority,
  onDuplicate
}) => {
  if (!task) {
    return (
      <div className="task-detail-panel">
        <div className="no-task-selected">
          Select a task to view details
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) {return `${seconds}s`;}
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffd700';
      case 'running': return '#4caf50';
      case 'done': return '#2196f3';
      case 'error': return '#f44336';
      default: return '#888';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.High: return '#f44336';
      case TaskPriority.Normal: return '#4caf50';
      case TaskPriority.Low: return '#2196f3';
      default: return '#888';
    }
  };

  const metadata = task.metadata as { label?: string; category?: string; description?: string };

  return (
    <div className="task-detail-panel">
      <div className="task-header">
        <h3>{metadata.label ?? 'No Label'}</h3>
        <span
          className="task-status"
          style={{ backgroundColor: getStatusColor(task.status) }}
        >
          {task.status}
        </span>
      </div>

      <div className="task-info">
        <div className="info-row">
          <span className="label">Type:</span>
          <span className="value">{task.type}</span>
        </div>
        <div className="info-row">
          <span className="label">Priority:</span>
          <span
            className="value"
            style={{ color: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Category:</span>
          <span className="value">{metadata.category ?? 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="label">Agent:</span>
          <span className="value">{task.agentId || 'None'}</span>
        </div>
        <div className="info-row">
          <span className="label">Started:</span>
          <span className="value">
            {new Date(task.startTime).toLocaleTimeString()}
          </span>
        </div>
        {task.duration && (
          <div className="info-row">
            <span className="label">Duration:</span>
            <span className="value">{formatDuration(task.duration)}</span>
          </div>
        )}
      </div>

      <div className="task-description">
        <h4>Description</h4>
        <p>{metadata.description ?? 'No description'}</p>
      </div>

      {task.error && (
        <div className="task-error">
          <h4>Error</h4>
          <p>{task.error}</p>
        </div>
      )}

      <div className="task-actions">
        <button
          onClick={() => onCancel(task.id)}
          disabled={task.status !== 'pending' && task.status !== 'running'}
          className="action-button cancel"
        >
          Cancel
        </button>
        <button
          onClick={() => onBoostPriority(task.id)}
          disabled={task.priority === TaskPriority.High || task.status !== 'pending'}
          className="action-button boost"
        >
          Boost Priority
        </button>
        <button
          onClick={() => onDuplicate(task)}
          className="action-button duplicate"
        >
          Duplicate
        </button>
      </div>
    </div>
  );
};
