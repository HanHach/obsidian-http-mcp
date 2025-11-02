import express, { type Request, type Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ObsidianClient } from '../client/obsidian.js';
import { listDir, listFiles } from '../tools/list.js';
import { readFile } from '../tools/read.js';
import { writeFile } from '../tools/write.js';
import { search } from '../tools/search.js';
import { moveFile } from '../tools/move.js';
import { deleteFile } from '../tools/delete.js';

export function createHttpServer(client: ObsidianClient, port: number) {
  const app = express();
  app.use(express.json());

  // Create MCP Server
  const mcpServer = new Server(
    {
      name: 'obsidian-http-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools/list handler
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_dir',
          description: 'List subdirectories in a path',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to list (optional, default: root)' },
            },
          },
        },
        {
          name: 'list_files',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to list (optional, default: root)' },
              extension: { type: 'string', description: 'Filter by extension (e.g., "md")' },
            },
          },
        },
        {
          name: 'read_file',
          description: 'Read content of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to file' },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Create or update a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to file' },
              content: { type: 'string', description: 'File content' },
              mode: {
                type: 'string',
                enum: ['create', 'overwrite', 'append'],
                description: 'Write mode',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'search',
          description: 'Search for text across all files',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              case_sensitive: { type: 'boolean', description: 'Case sensitive search' },
              regex: { type: 'boolean', description: 'Use regex pattern' },
              max_results: { type: 'number', description: 'Maximum results (default: 100)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'move_file',
          description: 'Move or rename a file',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Source path' },
              destination: { type: 'string', description: 'Destination path' },
              overwrite: { type: 'boolean', description: 'Overwrite if exists' },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'delete_file',
          description: 'Delete a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to file' },
              confirm: { type: 'boolean', description: 'Confirm deletion (required)' },
            },
            required: ['path', 'confirm'],
          },
        },
      ],
    };
  });

  // Register tools/call handler
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let result;
    switch (name) {
      case 'list_dir':
        result = await listDir(client, args as any);
        break;
      case 'list_files':
        result = await listFiles(client, args as any);
        break;
      case 'read_file':
        result = await readFile(client, args as any);
        break;
      case 'write_file':
        result = await writeFile(client, args as any);
        break;
      case 'search':
        result = await search(client, args as any);
        break;
      case 'move_file':
        result = await moveFile(client, args as any);
        break;
      case 'delete_file':
        result = await deleteFile(client, args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // MCP endpoint with StreamableHTTPServerTransport
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // Create new transport per request to avoid ID collisions
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      // Cleanup on connection close
      res.on('close', () => {
        transport.close();
      });

      // Connect server to transport
      await mcpServer.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    }
  });

  return app;
}
