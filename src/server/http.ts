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
import { findFiles } from '../tools/find.js';

export function createHttpServer(client: ObsidianClient, port: number) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Create MCP Server instance (singleton for all requests)
  const mcpServer = new Server(
    {
      name: 'obsidian-http',
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
          description: 'List subdirectories in a path. IMPORTANT: Paths must end with / for directories (e.g., "BUSINESS/" not "BUSINESS")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to directory WITH trailing slash (e.g., "BUSINESS/" or "" for root)'
              },
            },
          },
        },
        {
          name: 'list_files',
          description: 'List files in a directory. IMPORTANT: Directory paths must end with / (e.g., "Notes/" not "Notes")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path WITH trailing slash (e.g., "Notes/" or "" for root)'
              },
              extension: {
                type: 'string',
                description: 'Filter by extension (e.g., "md")'
              },
            },
          },
        },
        {
          name: 'read_file',
          description: 'Read content of a file. TIP: If you don\'t know exact filename, use find_files first. Use file path WITHOUT trailing slash (e.g., "Notes/meeting.md")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path WITHOUT trailing slash (e.g., "Notes/meeting.md")'
              },
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
              path: {
                type: 'string',
                description: 'Path to file'
              },
              content: {
                type: 'string',
                description: 'File content'
              },
              mode: {
                type: 'string',
                enum: ['create', 'overwrite', 'append'],
                description: 'Write mode (default: create)',
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
              query: {
                type: 'string',
                description: 'Search query'
              },
              case_sensitive: {
                type: 'boolean',
                description: 'Case sensitive search (default: false)'
              },
              regex: {
                type: 'boolean',
                description: 'Use regex pattern (default: false)'
              },
              max_results: {
                type: 'number',
                description: 'Maximum results (default: 100)'
              },
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
              source: {
                type: 'string',
                description: 'Source path'
              },
              destination: {
                type: 'string',
                description: 'Destination path'
              },
              overwrite: {
                type: 'boolean',
                description: 'Overwrite if exists (default: false)'
              },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'delete_file',
          description: 'Delete a file. By default moves to .trash-http-mcp/ for recovery. Set permanent=true for irreversible deletion.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to file'
              },
              confirm: {
                type: 'boolean',
                description: 'Confirm deletion (required: must be true)'
              },
              permanent: {
                type: 'boolean',
                description: 'If true, permanently delete (irreversible). Default: false (moves to .trash-http-mcp/)'
              },
            },
            required: ['path', 'confirm'],
          },
        },
        {
          name: 'find_files',
          description: 'Search files in vault with fuzzy matching. Use this when you don\'t know the exact filename.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (partial filename, can contain typos)'
              },
              fuzzy: {
                type: 'boolean',
                description: 'Enable fuzzy matching for typo tolerance (default: true)'
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of results (default: 10)'
              },
            },
            required: ['query'],
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
      case 'find_files':
        result = await findFiles(client, args as any);
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // MCP endpoint - Streamable HTTP (stateless)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // Create new transport per request (stateless pattern)
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
