import { BackgroundAgent } from '../../src/agents/background-agent';

// Mock MCPClient
const mockMCPClient = {} as any;

describe('BackgroundAgent', () => {
  let agent: BackgroundAgent;

  beforeEach(() => {
    agent = new BackgroundAgent(mockMCPClient);
  });

  test('should initialize with an empty queue and inactive state', () => {
    expect(agent.getQueueLength()).toBe(0);
    expect(agent.isActive()).toBe(false);
  });

  test('should start and emit started event', async () => {
    const startedSpy = jest.fn();
    agent.on('started', startedSpy);
    await agent.start();
    expect(agent.isActive()).toBe(true);
    expect(startedSpy).toHaveBeenCalled();
  });

  test('should not start again if already running', async () => {
    await agent.start();
    const startedSpy = jest.fn();
    agent.on('started', startedSpy);
    await agent.start();
    expect(startedSpy).not.toHaveBeenCalled();
  });

  test('should stop and emit stopped event', async () => {
    const stoppedSpy = jest.fn();
    agent.on('stopped', stoppedSpy);
    await agent.start();
    await agent.stop();
    expect(agent.isActive()).toBe(false);
    expect(stoppedSpy).toHaveBeenCalled();
  });

  test('should add a task and emit taskAdded', async () => {
    const taskAddedSpy = jest.fn();
    agent.on('taskAdded', taskAddedSpy);
    const task = jest.fn().mockResolvedValue(undefined);
    await agent.start();
    await agent.addTask(task);
    expect(agent.getQueueLength()).toBe(0); // Task should be processed immediately
    expect(taskAddedSpy).toHaveBeenCalled();
  });

  test('should process tasks and emit taskCompleted', async () => {
    const taskCompletedSpy = jest.fn();
    agent.on('taskCompleted', taskCompletedSpy);
    const task = jest.fn().mockResolvedValue(undefined);
    await agent.start();
    await agent.addTask(task);
    // Wait for the task to be processed
    await new Promise(res => setTimeout(res, 10));
    expect(task).toHaveBeenCalled();
    expect(taskCompletedSpy).toHaveBeenCalled();
  });

  test('should emit taskError on task failure', async () => {
    const taskErrorSpy = jest.fn();
    agent.on('taskError', taskErrorSpy);
    const errorTask = jest.fn().mockRejectedValue(new Error('fail'));
    await agent.start();
    await agent.addTask(errorTask);
    // Wait for the task to be processed
    await new Promise(res => setTimeout(res, 10));
    expect(taskErrorSpy).toHaveBeenCalled();
  });

  test('should process multiple tasks in order', async () => {
    const results: number[] = [];
    const task1 = jest.fn().mockImplementation(async () => { results.push(1); });
    const task2 = jest.fn().mockImplementation(async () => { results.push(2); });
    await agent.start();
    await agent.addTask(task1);
    await agent.addTask(task2);
    await new Promise(res => setTimeout(res, 20));
    expect(results).toEqual([1, 2]);
  });
});
