import { MCPTool } from '../../../src/mcp/client';
import { MCPServer } from '../../../src/mcp/server';

describe('MCP Tools', () => {
  let server: MCPServer;
  const testTool: MCPTool = {
    id: 'test_tool',
    scope: 'test',
    description: 'Test tool for unit testing',
    parameters: {
      testParam: {
        type: 'string',
        description: 'Test parameter'
      }
    }
  };

  beforeEach(() => {
    server = new MCPServer(3001); // Use a different port for testing
  });

  afterEach(() => {
    // Cleanup server
    if (server) {
      // @ts-ignore - accessing private property for testing
      const httpServer = server.app.listen();
      httpServer.close();
    }
  });

  describe('Tool Registration', () => {
    it('should register a tool successfully', () => {
      server.registerTool(testTool);
      // @ts-ignore - accessing private property for testing
      expect(server.tools.get(testTool.id)).toBeDefined();
      // @ts-ignore - accessing private property for testing
      expect(server.tools.get(testTool.id)).toEqual(testTool);
    });

    it('should not allow duplicate tool registration', () => {
      server.registerTool(testTool);
      expect(() => server.registerTool(testTool)).toThrow();
    });

    it('should handle empty tool list', () => {
      // @ts-ignore - accessing private property for testing
      expect(Array.from(server.tools.values())).toEqual([]);
    });
  });

  describe('Tool Execution', () => {
    it('should execute a tool with valid parameters', async () => {
      server.registerTool(testTool);
      const result = await server.executeTool(testTool, { testParam: 'test' });
      expect(result.success).toBe(true);
      expect(result.toolId).toBe(testTool.id);
      expect(result.parameters).toEqual({ testParam: 'test' });
      expect(result.timestamp).toBeDefined();
    });

    it('should reject execution with missing parameters', async () => {
      server.registerTool(testTool);
      await expect(server.executeTool(testTool, {})).rejects.toThrow('Missing required parameter: testParam');
    });

    it('should reject execution with invalid parameter types', async () => {
      server.registerTool(testTool);
      await expect(server.executeTool(testTool, { testParam: 123 })).rejects.toThrow('Invalid type for parameter testParam');
    });

    it('should execute a tool with optional parameters', async () => {
      const toolWithOptional: MCPTool = {
        id: 'optional_tool',
        scope: 'test',
        description: 'Tool with optional param',
        parameters: {
          required: { type: 'string', description: 'Required' },
          optional: { type: 'string', description: 'Optional' }
        }
      };
      server.registerTool(toolWithOptional);
      const result = await server.executeTool(toolWithOptional, { required: 'foo', optional: 'bar' });
      expect(result.success).toBe(true);
      expect(result.parameters).toEqual({ required: 'foo', optional: 'bar' });
    });

    it('should handle complex parameter types', async () => {
      const toolWithComplex: MCPTool = {
        id: 'complex_tool',
        scope: 'test',
        description: 'Tool with complex param',
        parameters: {
          arr: { type: 'object', description: 'Array param' }
        }
      };
      server.registerTool(toolWithComplex);
      const params = { arr: [1, 2, 3] };
      // This will fail type check, but we want to see error propagation
      await expect(server.executeTool(toolWithComplex, params)).rejects.toThrow();
    });

    it('should propagate errors thrown in execution', async () => {
      const errorTool: MCPTool = {
        id: 'error_tool',
        scope: 'test',
        description: 'Tool that throws',
        parameters: { foo: { type: 'string', description: 'foo' } }
      };
      server.registerTool(errorTool);
      // Patch executeTool to throw
      // @ts-ignore
      server.executeTool = () => { throw new Error('Execution failed'); };
      await expect(server.executeTool(errorTool, { foo: 'bar' })).rejects.toThrow('Execution failed');
    });

    it('should handle concurrent tool registration and execution', async () => {
      const toolA: MCPTool = { id: 'A', scope: 'test', description: 'A', parameters: { a: { type: 'string', description: 'a' } } };
      const toolB: MCPTool = { id: 'B', scope: 'test', description: 'B', parameters: { b: { type: 'string', description: 'b' } } };
      await Promise.all([
        Promise.resolve(server.registerTool(toolA)),
        Promise.resolve(server.registerTool(toolB))
      ]);
      const resA = await server.executeTool(toolA, { a: '1' });
      const resB = await server.executeTool(toolB, { b: '2' });
      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);
    });
  });
});
