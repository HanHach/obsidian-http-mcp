# Changelog

All notable changes to Obsidian HTTP MCP.

---

## [Unreleased] - v1.0.7 Edit File Tool

### Added

- `edit_file` tool - Pattern matching edits (old_string/new_string)
  - replace_all flag for global replacements
  - Uniqueness validation (errors if multiple matches without flag)
  - Cache invalidation for immediate discoverability
  - Impact: Enables surgical edits without manual full file rewrites

### Technical Notes

- Implementation: src/tools/edit.ts (88 lines), 3 files modified
- Pattern: Read full file → pattern match → replace → write
- Why not PATCH: Local REST API PATCH requires AI to read full file anyway to discover heading names (heading/block targeting needs full context). Pattern matching is structure-agnostic and more flexible.
- Architecture decision documented in ROADMAP.md

### Documentation

- Updated ROADMAP.md: Moved edit_file to v1.0.7 (completed), shifted tree/rename to v1.0.8/v1.0.9
- Removed patch_file from roadmap (redundant with edit_file, proven via doc-fetcher analysis)
- Deleted obsolete implementation plans (EDIT_FILE_IMPLEMENTATION_PLAN.md, IMPLEMENTATION_PLAN.md)

---

## [1.0.6] - 2025-11-06

### Fixed

- Restored .npmignore for correct package distribution

---

## [1.0.5] - 2025-11-06

### Changed

- Improved cross-platform setup documentation (Windows/WSL2)
- Restructured installation guide with clear step-by-step format

### Fixed

- Corrected Windows IP discovery for WSL2 users (`ipconfig | findstr "vEthernet"`)
- Added `-s user` flag for global Claude MCP installation

---

## [1.0.4] - 2025-11-06

### Fixed

- Package distribution: Added explicit "files" array to package.json

---

## [1.0.3] - 2025-11-06

### Fixed

- CLI wizard launch: Fixed bin path (dist/cli.js → dist/index.js)

---

## [1.0.2] - 2025-01-06

### Added

- Persistent config storage in `~/.obsidian-mcp/config.json` (0600 permissions)
- Interactive setup wizard via `--setup` flag
- Config priority chain: CLI args > env vars > config.json > .env > defaults

### Changed

- Improved error messages suggesting `--setup` when config missing
- Updated help text with config priority documentation

### Development Notes (1.0.2)

- +150 lines across 3 files (config.ts, cli.ts, index.ts)
- Zero new dependencies (Node.js built-ins only)
- Backward compatible with .env files and CLI args
- 9/9 tests passing

---

## [1.0.1] - 2025-11-06

### Added in 1.0.1

- `get_file_info` tool - Get file metadata (size, modified timestamp)
- `create_directory` tool - Create vault directories with idempotent behavior

### Fixed

- Path validation in `get_file_info` - Rejects directory paths (trailing slash)
- Error handling in `directoryExists()` - Correctly propagates 401/500 errors
- Timestamp fallback in `getFileInfo()` - Returns empty string when header missing

### Development Notes (1.0.1)

- 11 tools total (9 → 11)
- +290 lines across 10 files
- 3 bugs detected and fixed via code review
- 1h40 dev time

---

## [1.0.0] - 2025-11-04

### Added in 1.0.0

- HTTP-native MCP server using `StreamableHTTPServerTransport`
- 9 core tools: list_dir, list_files, find_files, read_file, write_file, search, move_file, delete_file, delete_folder
- Soft delete with `.trash-http-mcp/` directory
- Fuzzy file search with 60s cache
- CLI with environment variable support

### Performance Improvements

- Search 1000 files: 50s → 2-3s (96% faster via batched parallel reads)
- Fuzzy matching 10k files: 500ms → 50ms (90% faster via filtered subset)
- Delete operations: Protected from API throttling (20 concurrent max)

### Security Hardening

- Path traversal protection with URL decoding validation
- ReDoS protection with 500 char query limit
- SECURITY.md with deployment checklist

### Code Quality

- TypeScript strict mode with typed interfaces (removed all `as any` casts)
- Batch processing utility for concurrent operations
- Single source of truth for version (package.json import)
- PORT validation (1-65535 range check)

### Development Notes (1.0.0)

- +408 lines across 20 files
- 2h45 dev time

---

## [0.9.0] - 2025-11-02

### Added in 0.9.0 (Pre-release)

- Smart file search with fuzzy matching
- Recursive vault scanning
- Emoji support in filenames via URL encoding
- 60s cache for file listings

---

## Architecture Notes

**Problem Solved**: 150+ stdio-based Obsidian MCP servers fail with BrokenPipeError (Claude Code CLI bug #3071)

**Solution**: First HTTP-native MCP server for Obsidian using official SDK

**Flow**:

```text
Claude Code CLI → HTTP (POST /mcp) → Express + MCP SDK → Obsidian REST API (port 27123)
```

**Key Decisions**:

- Stateless pattern (new transport per request)
- Trailing slash requirement for directories (Obsidian API)
- Batch processing to prevent API throttling
- Soft delete by default for AI operation safety

**Critical Points for Devs**:

1. **Trailing slash REQUIRED**: Directories must end with `/` (e.g., `BUSINESS/`), files must not (e.g., `note.md`)
2. **Accept header**: MCP SDK requires `Accept: application/json, text/event-stream`
3. **Cross-platform**: WSL2 requires `0.0.0.0` binding, reinstall `node_modules` after platform switch
