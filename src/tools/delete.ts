import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';
import { invalidateFilesCache, walkVault } from './find.js';

function validateDeleteArgs(
  args: { path?: string; confirm?: boolean },
  operation: 'file' | 'folder'
): { valid: boolean; error?: string } {
  if (!args.path) {
    return { valid: false, error: 'path parameter is required' };
  }
  if (!args.confirm) {
    return {
      valid: false,
      error: `confirm=true is required to delete a ${operation} (safety check)`,
    };
  }
  return { valid: true };
}

export async function deleteFile(
  client: ObsidianClient,
  args: { path: string; confirm?: boolean; permanent?: boolean }
): Promise<ToolResult> {
  try {
    const validation = validateDeleteArgs(args, 'file');
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    const exists = await client.fileExists(args.path);
    if (!exists) {
      return {
        success: false,
        error: `File not found: ${args.path}`,
      };
    }

    if (args.permanent) {
      // Hard delete: permanent removal (cannot be recovered from trash)
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
      // Soft delete (default): preserve user data in trash for manual recovery via Obsidian
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

export async function deleteFolder(
  client: ObsidianClient,
  args: { path: string; confirm?: boolean; permanent?: boolean }
): Promise<ToolResult> {
  try {
    const validation = validateDeleteArgs(args, 'folder');
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    // Get all files recursively
    const allFiles = await walkVault(client, args.path);

    if (allFiles.length === 0) {
      return {
        success: false,
        error: 'Folder empty or not found',
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (args.permanent) {
      // Hard delete: permanently remove all files (cannot be recovered)
      await Promise.all(allFiles.map((f) => client.deleteFile(f)));
      invalidateFilesCache();

      return {
        success: true,
        data: {
          deleted_files: allFiles.length,
          message: 'Files permanently deleted (irreversible). Empty folders remain.',
        },
      };
    } else {
      // Soft delete (default): preserve folder structure in trash for easy recovery
      await Promise.all(
        allFiles.map(async (filePath) => {
          const trashPath = `.trash-http-mcp/${timestamp}/${filePath}`;
          const content = await client.readFile(filePath);
          await client.writeFile(trashPath, content);
          await client.deleteFile(filePath);
        })
      );

      invalidateFilesCache();

      return {
        success: true,
        data: {
          moved_files: allFiles.length,
          trash_location: `.trash-http-mcp/${timestamp}/`,
          message: 'Files moved to trash (recoverable). Empty folders remain.',
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
