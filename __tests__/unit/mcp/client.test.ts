import { MCPClient } from '../../../src/mcp/client';
import { createTestTool, MockExpressServer } from '../../setup';

describe('MCP Client', () => {
  let client: MCPClient;
  let mockServer: MockExpressServer;
  const testTool = createTestTool();

  beforeEach(() => {
    mockServer = new MockExpressServer();
    client = new MCPClient('http://localhost:3001');
  });

  describe('Initialization', () => {
    it('should initialize with default base URL', () => {
      const defaultClient = new MCPClient();
      expect(defaultClient).toBeDefined();
    });

    it('should initialize with custom base URL', () => {
      const customClient = new MCPClient('http://custom-url');
      expect(customClient).toBeDefined();
    });

    it('should handle empty tool list', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([]);
      });
      await client.initialize();
      expect(client.getAllTools()).toEqual([]);
    });

    it('should handle invalid tool list', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([null, undefined, 123]);
      });
      await expect(client.initialize()).resolves.toBeUndefined();
      expect(client.getAllTools()).toEqual([]);
    });

    it('should emit error event on network failure', async () => {
      const errorSpy = jest.fn();
      client.on('error', errorSpy);
      // Simulate network failure by not setting up mockServer
      client = new MCPClient('http://localhost:9999');
      await expect(client.initialize()).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Tool Management', () => {
    it('should fetch and register tools on initialization', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });

      await client.initialize();
      const tools = client.getAllTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].id).toBe(testTool.id);
    });

    it('should get tool by ID', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });

      await client.initialize();
      const tool = client.getTool(testTool.id);
      expect(tool).toBeDefined();
      expect(tool?.id).toBe(testTool.id);
    });

    it('should get tools by category', async () => {
      const categorizedTool = createTestTool({ category: 'test' });
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([categorizedTool]);
      });

      await client.initialize();
      const tools = client.getToolsByCategory('test');
      expect(tools).toHaveLength(1);
      expect(tools[0].category).toBe('test');
    });

    it('should update tool list on re-initialization', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });
      await client.initialize();
      expect(client.getAllTools()).toHaveLength(1);
      // Update tool list
      const newTool = createTestTool({ id: 'new_tool' });
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([newTool]);
      });
      await client.initialize();
      expect(client.getAllTools()).toHaveLength(1);
      expect(client.getTool('new_tool')).toBeDefined();
    });

    it('should remove tool if not present in new list', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });
      await client.initialize();
      expect(client.getTool(testTool.id)).toBeDefined();
      // Now return empty list
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([]);
      });
      await client.initialize();
      expect(client.getTool(testTool.id)).toBeUndefined();
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool with valid parameters', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });

      mockServer.post(`/execute/${testTool.id}`, (req: any, res: any) => {
        res.json({ success: true, result: 'test result' });
      });

      await client.initialize();
      const result = await client.executeTool(testTool.id, { testParam: 'test' });
      expect(result.success).toBe(true);
      expect(result.result).toBe('test result');
    });

    it('should throw error for non-existent tool', async () => {
      await client.initialize();
      await expect(client.executeTool('non_existent', {})).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });

      mockServer.post(`/execute/${testTool.id}`, (req: any, res: any) => {
        res.status(500).json({ error: 'Server error' });
      });

      await client.initialize();
      await expect(client.executeTool(testTool.id, { testParam: 'test' })).rejects.toThrow();
    });

    it('should emit error event on execution failure', async () => {
      mockServer.get('/tools', (req: any, res: any) => {
        res.json([testTool]);
      });
      mockServer.post(`/execute/${testTool.id}`, (req: any, res: any) => {
        res.status(500).json({ error: 'fail' });
      });
      const errorSpy = jest.fn();
      client.on('error', errorSpy);
      await client.initialize();
      await expect(client.executeTool(testTool.id, { testParam: 'test' })).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
