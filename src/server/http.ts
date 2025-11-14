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
import { deleteFile, deleteFolder } from '../tools/delete.js';
import { findFiles } from '../tools/find.js';
import { getFileInfo } from '../tools/fileinfo.js';
import { createDirectory } from '../tools/directory.js';
import { editFile } from '../tools/edit.js';
import type {
  ListDirArgs,
  ListFilesArgs,
  ReadFileArgs,
  WriteFileArgs,
  SearchArgs,
  MoveFileArgs,
  DeleteFileArgs,
  DeleteFolderArgs,
  FindFilesArgs,
  GetFileInfoArgs,
  CreateDirectoryArgs,
  EditFileArgs,
} from '../types/tools.js';
import { VERSION } from '../utils/version.js';

export function createHttpServer(client: ObsidianClient, port: number) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Create MCP Server instance (singleton for all requests)
  const mcpServer = new Server(
    {
      name: 'obsidian-http',
      version: VERSION,
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
          description: 'List subdirectories in a path. Returns only folder names (not files). IMPORTANT: Path must end with / (e.g., "BUSINESS/" not "BUSINESS")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path WITH trailing slash (e.g., "BUSINESS/" or "" for root). Required by Obsidian API.'
              },
            },
          },
        },
        {
          name: 'list_files',
          description: 'List files in a directory. Returns only files (not folders). IMPORTANT: Path must end with / (e.g., "Notes/" not "Notes")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path WITH trailing slash (e.g., "Notes/" or "" for root). Required by Obsidian API.'
              },
              extension: {
                type: 'string',
                description: 'Filter by extension without dot (e.g., "md" for markdown files)'
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
          description: 'Create or update a file. Use mode=create for new files, mode=overwrite to replace existing, mode=append to add to end.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path without trailing slash (e.g., "Notes/daily.md")'
              },
              content: {
                type: 'string',
                description: 'File content (markdown text)'
              },
              mode: {
                type: 'string',
                enum: ['create', 'overwrite', 'append'],
                description: 'create: fail if exists (safe), overwrite: replace file, append: add to end. Default: create',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'search',
          description: 'Search for text inside file contents recursively across entire vault. Use this to find files containing specific text (like grep).',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Text to search for in file contents (not filenames - use find_files for that)'
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
          description: 'Move or rename a file. Works for both moving to different folder and renaming in same folder.',
          inputSchema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description: 'Current file path (e.g., "Notes/old.md")'
              },
              destination: {
                type: 'string',
                description: 'New file path (e.g., "Archive/new.md")'
              },
              overwrite: {
                type: 'boolean',
                description: 'Overwrite destination if exists (default: false, will fail if exists)'
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
          name: 'delete_folder',
          description: 'Delete all files in a folder recursively. By default moves to .trash-http-mcp/ (soft delete). Use permanent=true for irreversible deletion. Empty folders remain (API limitation).',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to folder'
              },
              confirm: {
                type: 'boolean',
                description: 'Must be true (safety check)'
              },
              permanent: {
                type: 'boolean',
                description: 'If true, permanently delete. Default: false (trash)'
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
        {
          name: 'get_file_info',
          description: 'Get file metadata (size, modification date). Returns exists: false if file not found.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path without trailing slash (e.g., "Notes/meeting.md")'
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'create_directory',
          description: 'Create a new directory. Idempotent (returns success even if already exists). Does NOT create parent directories - they must exist first.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path WITHOUT trailing slash (e.g., "Projects/AI" not "Projects/AI/"). Unlike list_dir/list_files, no trailing slash here.'
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'edit_file',
          description: 'Surgically edit file content using exact string replacement (pattern matching). Use this for arbitrary text edits anywhere in the file. IMPORTANT: old_string must match exactly (including whitespace/indentation). Include enough context to make old_string unique. For structured edits (headings/frontmatter), consider using patch_file instead (coming soon).',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to edit (e.g., "Notes/meeting.md")'
              },
              old_string: {
                type: 'string',
                description: 'Exact text to replace (must match exactly including whitespace). Include enough context to ensure uniqueness. TIP: If multiple matches exist, either use replace_all or add more surrounding context.'
              },
              new_string: {
                type: 'string',
                description: 'Replacement text. Can be empty string for deletion.'
              },
              replace_all: {
                type: 'boolean',
                description: 'Replace all occurrences (default: false). If false and multiple matches exist, returns error. Use true only when intentionally replacing all instances.'
              }
            },
            required: ['path', 'old_string', 'new_string'],
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
        result = await listDir(client, (args || {}) as unknown as ListDirArgs);
        break;
      case 'list_files':
        result = await listFiles(client, (args || {}) as unknown as ListFilesArgs);
        break;
      case 'read_file':
        result = await readFile(client, (args || {}) as unknown as ReadFileArgs);
        break;
      case 'write_file':
        result = await writeFile(client, (args || {}) as unknown as WriteFileArgs);
        break;
      case 'search':
        result = await search(client, (args || {}) as unknown as SearchArgs);
        break;
      case 'move_file':
        result = await moveFile(client, (args || {}) as unknown as MoveFileArgs);
        break;
      case 'delete_file':
        result = await deleteFile(client, (args || {}) as unknown as DeleteFileArgs);
        break;
      case 'delete_folder':
        result = await deleteFolder(client, (args || {}) as unknown as DeleteFolderArgs);
        break;
      case 'find_files':
        result = await findFiles(client, (args || {}) as unknown as FindFilesArgs);
        break;
      case 'get_file_info':
        result = await getFileInfo(client, (args || {}) as unknown as GetFileInfoArgs);
        break;
      case 'create_directory':
        result = await createDirectory(client, (args || {}) as unknown as CreateDirectoryArgs);
        break;
      case 'edit_file':
        result = await editFile(client, (args || {}) as unknown as EditFileArgs);
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
