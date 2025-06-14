import { MCPTool } from '../src/mcp/client';

// Test utilities
export const createTestTool = (overrides: Partial<MCPTool> = {}): MCPTool => ({
  id: 'test_tool',
  scope: 'test',
  description: 'Test tool for unit testing',
  parameters: {
    testParam: {
      type: 'string',
      description: 'Test parameter'
    }
  },
  ...overrides
});

// Mock Express server
export class MockExpressServer {
  private routes: Map<string, any> = new Map();
  private middleware: any[] = [];

  use(middleware: any) {
    this.middleware.push(middleware);
    return this;
  }

  get(path: string, handler: any) {
    this.routes.set(`GET ${path}`, handler);
    return this;
  }

  post(path: string, handler: any) {
    this.routes.set(`POST ${path}`, handler);
    return this;
  }

  async handleRequest(method: string, path: string, body?: any) {
    const handler = this.routes.get(`${method} ${path}`);
    if (!handler) {
      throw new Error(`No handler found for ${method} ${path}`);
    }

    const req = { body };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await handler(req, res);
    return res;
  }
}

// Global test timeout
jest.setTimeout(10000);
