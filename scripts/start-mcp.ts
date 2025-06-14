import { MCPTool } from '../src/mcp/client';
import { MCPServer } from '../src/mcp/server';

// Load tools from mcp.json
const tools: MCPTool[] = require('../mcp.json').tools;

// Create and start the server
const server = new MCPServer();

// Register all tools
tools.forEach(tool => {
  server.registerTool(tool);
});

// Start the server
server.start();
