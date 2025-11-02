import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';
import { invalidateFilesCache } from './find.js';

export async function deleteFile(
  client: ObsidianClient,
  args: { path: string; confirm?: boolean; permanent?: boolean }
): Promise<ToolResult> {
  try {
    if (!args.path) {
      return {
        success: false,
        error: 'path parameter is required',
      };
    }

    if (!args.confirm) {
      return {
        success: false,
        error: 'confirm=true is required to delete a file (safety check)',
      };
    }

    const exists = await client.fileExists(args.path);
    if (!exists) {
      return {
        success: false,
        error: `File not found: ${args.path}`,
      };
    }

    if (args.permanent) {
      // Hard delete (irreversible)
      await client.deleteFile(args.path);
      invalidateFilesCache();

      return {
        success: true,
        data: {
          deleted_path: args.path,
          message: 'File permanently deleted (irreversible)',
        },
      };
    } else {
      // Soft delete: move to .trash-http-mcp/ (default, recoverable)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = args.path.split('/').pop() || args.path;
      const trashPath = `.trash-http-mcp/${timestamp}_${filename}`;

      const content = await client.readFile(args.path);
      await client.writeFile(trashPath, content);
      await client.deleteFile(args.path);

      invalidateFilesCache();

      return {
        success: true,
        data: {
          original_path: args.path,
          trash_location: trashPath,
          message: 'File moved to .trash-http-mcp/ (open in Obsidian to restore)',
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
