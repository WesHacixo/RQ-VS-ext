import { EventEmitter } from 'events';
import fetch from 'node-fetch';

export interface MCPTool {
  id: string;
  scope: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
  }>;
  category?: string;
  estimatedCost?: number;
}

export class MCPClient extends EventEmitter {
  private baseUrl: string;
  private tools: Map<string, MCPTool> = new Map();

  constructor(baseUrl: string = 'http://localhost:3000') {
    super();
    this.baseUrl = baseUrl;
  }

  public async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tools`);
      const tools = await response.json() as MCPTool[];

      tools.forEach(tool => {
        this.tools.set(tool.id, tool);
      });

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async executeTool(toolId: string, parameters: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/execute/${toolId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  public getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: string): MCPTool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }
}
