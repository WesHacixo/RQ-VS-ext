import express, { Request, RequestHandler, Response } from 'express';
import { MCPTool } from './client';

export class MCPServer {
  private app: express.Application;
  private tools: Map<string, MCPTool> = new Map();
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Get all tools
    this.app.get('/tools', ((req: Request, res: Response) => {
      res.json(Array.from(this.tools.values()));
    }) as RequestHandler);

    // Execute a tool
    this.app.post('/execute/:toolId', (async (req: Request, res: Response) => {
      const { toolId } = req.params;
      const tool = this.tools.get(toolId);

      if (!tool) {
        return res.status(404).json({ error: `Tool ${toolId} not found` });
      }

      try {
        const result = await this.executeTool(tool, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }) as RequestHandler);
  }

  private async executeTool(tool: MCPTool, parameters: Record<string, any>): Promise<any> {
    // Validate parameters
    for (const [paramName, paramConfig] of Object.entries(tool.parameters)) {
      if (!(paramName in parameters)) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }

      const value = parameters[paramName];
      if (typeof value !== paramConfig.type) {
        throw new Error(`Invalid type for parameter ${paramName}. Expected ${paramConfig.type}, got ${typeof value}`);
      }
    }

    // Here you would implement the actual tool execution logic
    // For now, we'll just return a mock response
    return {
      success: true,
      toolId: tool.id,
      parameters,
      timestamp: new Date().toISOString()
    };
  }

  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.id, tool);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`MCP Server running on port ${this.port}`);
    });
  }
}
