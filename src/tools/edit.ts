import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';
import { invalidateFilesCache } from './find.js';

/**
 * Helper function to count occurrences of a substring in content
 */
function countOccurrences(content: string, substring: string): number {
  if (!substring) {
    return 0;
  }
  return content.split(substring).length - 1;
}

/**
 * Edit file using exact string replacement pattern (like Claude Code Edit tool)
 *
 * @param client - Obsidian API client
 * @param args - Edit arguments (path, old_string, new_string, replace_all)
 * @returns ToolResult with success/error and occurrences replaced
 */
export async function editFile(
  client: ObsidianClient,
  args: {
    path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }
): Promise<ToolResult> {
  try {
    // 1. Validation - check required parameters
    if (!args.path || !args.old_string || args.old_string.length === 0 || args.new_string === undefined) {
      return {
        success: false,
        error: 'path, old_string, and new_string parameters are required',
      };
    }

    // 2. Read current file content
    const content = await client.readFile(args.path);

    // 3. Count occurrences of old_string
    const occurrences = countOccurrences(content, args.old_string);

    // 4. Validate uniqueness
    if (occurrences === 0) {
      return {
        success: false,
        error: `old_string not found in ${args.path}. Make sure it matches exactly (including whitespace).`,
      };
    }

    if (occurrences > 1 && !args.replace_all) {
      return {
        success: false,
        error: `Found ${occurrences} occurrences of old_string. Either:\n` +
               `1. Set replace_all=true to replace all ${occurrences} occurrences, OR\n` +
               `2. Include more context in old_string to make it unique`,
      };
    }

    // 4.5. Check for no-op (identical strings)
    if (args.old_string === args.new_string) {
      return {
        success: true,
        data: {
          path: args.path,
          occurrences_replaced: 0,
          message: 'No changes needed (strings identical)',
        },
      };
    }

    // 5. Perform replacement
    const newContent = args.replace_all
      ? content.replaceAll(args.old_string, args.new_string)
      : content.replace(args.old_string, args.new_string);

    // 6. Write back to file
    await client.writeFile(args.path, newContent);

    // 7. Invalidate cache so changes are immediately discoverable
    invalidateFilesCache();

    return {
      success: true,
      data: {
        path: args.path,
        occurrences_replaced: args.replace_all ? occurrences : 1,
        message: `Successfully replaced ${args.replace_all ? occurrences : 1} occurrence(s)`,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Provide clearer error messages for common cases
    if (message.includes('ENOENT')) {
      return {
        success: false,
        error: `File not found: ${args.path}`,
      };
    }

    if (message.includes('EACCES') || message.includes('EPERM')) {
      return {
        success: false,
        error: `Permission denied: ${args.path}`,
      };
    }

    return {
      success: false,
      error: message,
    };
  }
}
