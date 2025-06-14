import { EventEmitter } from 'events';
import { MCPClient } from '../mcp/client';

export class BackgroundAgent extends EventEmitter {
  private mcpClient: MCPClient;
  private isRunning: boolean = false;
  private taskQueue: Array<() => Promise<void>> = [];
  private processingQueue: boolean = false;

  constructor(mcpClient: MCPClient) {
    super();
    this.mcpClient = mcpClient;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('started');

    // Start processing the queue
    this.processQueue();
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('stopped');
  }

  public async addTask(task: () => Promise<void>): Promise<void> {
    this.taskQueue.push(task);
    this.emit('taskAdded');

    if (!this.processingQueue) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isRunning) {
      return;
    }

    this.processingQueue = true;

    while (this.taskQueue.length > 0 && this.isRunning) {
      const task = this.taskQueue.shift();
      if (task) {
        try {
          await task();
          this.emit('taskCompleted');
        } catch (error) {
          this.emit('taskError', error);
        }
      }
    }

    this.processingQueue = false;
  }

  public getQueueLength(): number {
    return this.taskQueue.length;
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}
