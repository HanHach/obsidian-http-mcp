# Obsidian HTTP MCP Server - Roadmap

**Last Updated**: 2025-11-08

---

## 🎯 Vision & Goals

**Mission**: Become the standard HTTP-native MCP server for Obsidian, solving stdio bugs for users.

**Key Results**:

1. GitHub stars via quality & stability
2. npm downloads via real user value
3. Top result for "obsidian mcp claude code"
4. Community-driven feature development

---

## 📅 Release Timeline

### v1.0 - MVP ✅ COMPLETED (2025-11-03)

**Goal**: Launch with core features, 0 bugs

**Features**:

- ✅ HTTP server with MCP endpoint
- ✅ 9 core tools (list_dir, list_files, find_files, read, write, search, move, delete_file, delete_folder)
- ✅ CLI with configuration
- ✅ Environment variable support
- ✅ Soft delete with `.trash-http-mcp/`
- ✅ Complete documentation
- ✅ **Performance optimizations** (search 50s→2s, fuzzy 500ms→50ms)
- ✅ **Type safety** (removed all `as any` casts)
- ✅ **Code quality** (PORT validation, version management, batch processing)

**Status**: Published to npm

**Performance Benchmarks**:

- Search 1000 files: 50s → 2-3s (96% faster)
- Fuzzy matching 10k files: 500ms → 50ms (90% faster)
- Delete operations: Protected from API throttling (20 concurrent max)

---

### v1.0.1 - Core Tools Extension ✅ COMPLETED (2025-11-06)

**Goal**: Add essential filesystem metadata tools

**Features**:

- ✅ `get_file_info` tool - File metadata (size, modified timestamp)
- ✅ `create_directory` tool - Create vault directories
- ✅ **Security fixes**: Path validation, error handling improvements
- ✅ **Code review**: All bugs identified and fixed

**Changes**:

- 9 tools → 11 tools
- Fixed path traversal validation in `get_file_info`
- Fixed error propagation in `directoryExists()` (401/500 now throw correctly)
- Fixed timestamp fallback (empty string instead of current time)

---

### v1.0.2 - Persistent Config ✅ COMPLETED (2025-11-06)

**Goal**: Persistent configuration storage

**Features**:

- ✅ Config storage in `~/.obsidian-mcp/config.json`
- ✅ Interactive setup wizard (`--setup` flag)
- ✅ Config priority chain (CLI args > env vars > config.json > .env)
- ✅ Backward compatible with .env

---

### v1.0.3-1.0.6 - NPM Package & Documentation ✅ COMPLETED (2025-11-06)

**Goal**: Fix npm package distribution and improve documentation

**Changes**:

- ✅ v1.0.3: Fixed bin path (dist/cli.js → dist/index.js)
- ✅ v1.0.4: Added "files" array to package.json
- ✅ v1.0.5: Improved cross-platform documentation (Windows/WSL2)
- ✅ v1.0.6: Restored .npmignore for correct distribution

---

### v1.0.7 - Edit File Tool ✅ COMPLETED

**Goal**: Pattern matching edits for surgical file modifications

**Status**: Implemented in branch review-project-documentation (commit 5590ad2)

**API**:
```typescript
edit_file({
  path: string,
  old_string: string,
  new_string: string,
  replace_all?: boolean
})
```

**Features**:
- Pattern matching: old_string must match exactly (including whitespace)
- Uniqueness validation: Errors if multiple matches without replace_all flag
- replace_all flag: Optionally replace all occurrences
- Cache invalidation for immediate discoverability

**Implementation**: src/tools/edit.ts (88 lines)

**Token impact**: Enables surgical edits without full file rewrites (AI still reads full file, but avoids manual rewrite)

**Why not PATCH**: Local REST API PATCH requires AI to read full file anyway to discover heading names. Pattern matching is more flexible and structure-agnostic.

**Effort**: ~90 lines, 3 files modified

---

### v1.0.8 - Tree Tool

**Goal**: Display vault structure as readable tree

**API**:
```typescript
tree({ path?: string, max_depth?: number, include_files?: boolean })
```

**Returns**: ASCII tree visualization
```
TECH/
├── SSH WSL2-Windows Guide.md
├── Folder1/
│   └── File.md
└── Folder2/
```

**Use case**: Explore vault structure without multiple list_dir calls

**Effort**: ~80 lines, 2 files modified

---

### v1.0.9 - Rename Tool

**Goal**: Unified tool for renaming files and directories

**Why**: Current approach requires `move_file` for both operations, which is unintuitive for AI. Need explicit tool.

**API**:
```typescript
rename({
  path: string,           // File or directory path
  newName: string,        // New name only (not full path)
  type: "file" | "directory"  // Explicit type for clarity
})
```

**Features**:
- ✅ Auto-detect if path is file or directory
- ✅ Validates type parameter matches actual path type
- ✅ Returns error if mismatch (safety)
- ✅ Returns new full path on success

**Returns**:
```json
{
  "success": true,
  "oldPath": "PERSO",
  "newPath": "Passions-Perso",
  "type": "directory"
}
```

**Examples**:
```typescript
// Rename file
rename({ path: "note.md", newName: "new-note.md", type: "file" })

// Rename directory
rename({ path: "PERSO", newName: "Passions-Perso", type: "directory" })
```

**Token impact**: Clearer intent for AI (no confusion about file vs folder)

**Effort**: ~100 lines, 2 files modified

---

### v1.1 - Token Optimization Tools 🔥 NEXT PRIORITY

**Goal**: Drastically reduce token usage for file operations

**Why**: Current approach requires reading + overwriting entire files (even for small edits), wasting 95%+ tokens

---

#### Feature 1: `edit_file` tool

Smart editing with old_string/new_string pattern (like native Claude Code Edit tool)

**API**:
```typescript
edit_file({ path: string, old_string: string, new_string: string, replace_all?: boolean })
```

**Returns**: Diff output only (not full file)

**Token impact**: ~98% reduction (example: 300-line file edit = 200 tokens instead of 10,000)

---

#### Feature 2: Partial `read_file`

Read specific line ranges instead of entire file

**API**:
```typescript
read_file({ path: string, offset?: number, limit?: number })
```

**Token impact**: ~94% reduction (example: read 20 lines from 300-line file = 300 tokens instead of 5,000)

---

#### Feature 3: Enhanced `search`

Add path filter and context_lines control

**API**:
```typescript
search({ query: string, path?: string, context_lines?: number, ... })
```

**Token impact**: ~98% reduction when targeting specific file (example: find text in file = 100 tokens instead of 5,000)

---

**Implementation**: ~200 lines, 5 files modified

**Backward compatible**: All existing tools unchanged when new parameters omitted

---

### v1.2 - Batch Operations

**Goal**: Add batch operations for efficiency

#### Feature: `batch_move` tool

Bulk move multiple files in single API call

**API**:
```typescript
batchMove({
  operations: [
    { source: "file1.md", destination: "folder/file1.md" },
    { source: "file2.md", destination: "folder/file2.md" },
    ...N total...
  ]
})
```

**Returns**: Detailed results + summary
```json
{
  "success": true,
  "summary": "42/45 moved successfully",
  "moved": [
    { source: "file1.md", destination: "folder/file1.md" },
    ...all moved files...
  ],
  "failed": [
    { source: "bad1.md", error: "Invalid path" },
    ...errors...
  ]
}
```

**Token impact**: 1 API call + 1 response instead of 45 calls (95% reduction)

**Effort**: ~150 lines, 2 files modified

---

### v1.3 - Production Hardening & UX Polish

**Goal**: Security improvements + community-driven enhancements

**Security Features** (Optional - for production deployments):

- [ ] Optional bearer token authentication middleware
- [ ] Rate limiting configuration (express-rate-limit)
- [ ] HTTPS enforcement option
- [ ] Audit logging for sensitive operations
- [ ] Configurable host binding (127.0.0.1 vs 0.0.0.0)

**UX Features**:

- [ ] Auto-detect Obsidian REST API URL (check ports 27123/27124)
- [ ] `--debug` flag for verbose logs
- [ ] Better error messages (sanitize paths, add suggestions)
- [ ] Health check improvements

**User-driven features** (wait for >3 requests):

- Frontmatter tools (`get_frontmatter`, `set_frontmatter`)
- Tag tools (`add_tags`, `remove_tags`, `list_tags`)
- Template support
- Graph tools (backlinks)

**Note**: Security features are optional add-ons for users who need public deployment. Current scope (trusted network) remains unchanged.

---

### v1.3 - Quality & Testing

**Goal**: Production-ready reliability

**Features**:

- [ ] Unit test suite (tools only)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker support (optional deployment)
- [ ] Performance benchmarks

**Nice-to-have** (if time permits):

- Interactive setup wizard
- Web UI for testing (localhost:3000/ui)

---

### v2.0 - Multi-vault Support

**Goal**: Support multiple vaults in single server instance

**Why**: Isolate personal/professional/projects (e.g., one vault on port 27123, another on 27124)

**Config `.env`**

```bash
# Single vault (default - backward compatible)
OBSIDIAN_API_KEY=xxx
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000

# OR Multi-vault
VAULTS=[{"name":"personal","apiKey":"key1","baseUrl":"http://127.0.0.1:27123"},{"name":"work","apiKey":"key2","baseUrl":"http://127.0.0.1:27124"}]
PORT=3000
```

**Implementation**:

1. `vault-manager.ts` - NEW: Manage multiple ObsidianClient instances
2. `types/index.ts` - Add VaultConfig interface
3. `config.ts` - Parse VAULTS JSON array (fallback to single vault)
4. All tools - Add optional `vault` parameter (default to first vault)
5. `http.ts` - Pass vault to tools

**Usage**:

```typescript
// Single vault (no vault param needed)
read_file({ path: "note.md" })

// Multi-vault (specify vault)
read_file({ vault: "work", path: "meeting.md" })
```

**Backward compatible**: Existing single-vault configs continue working

**Effort**: ~150 lines, 5 files modified

---

### v2.1 - Community Features

**Goal**: Implement most-requested features

**Features** (priority based on GitHub issues):

- [ ] **Batch operations** (bulk move/delete/tag)
- [ ] **Template support** (Templater integration)
- [ ] **Daily notes helper** (auto-create, navigate)
- [ ] **Graph tools** (backlinks, forward links)

**NOT in scope** (separate projects if needed):

- ~~Semantic search~~ (too heavy - vector DB, embeddings, costs)
- ~~Plugin mode~~ (different architecture, separate codebase)
- ~~VS Code/Raycast extensions~~ (out of scope)

---

### v2.2 - Performance Optimization

**Goal**: Optimize for large vaults (5000+ notes)

**Features**:

- [ ] Extend cache TTL options (configurable)
- [ ] Parallel tool execution
- [ ] Response streaming for large files
- [ ] Request queuing

**Note**: In-memory cache already exists (60s TTL in find.ts)

---

## 🔮 Future Ideas (Backlog)

**Note**: These are ideas ONLY. Implementation requires community demand (>5 users requesting).

### Performance

- [ ] WebSocket real-time updates
- [ ] GraphQL-style batch queries

### Features

- [ ] Duplicate note detection
- [ ] Note merge tool
- [ ] Export to other formats (PDF, HTML)

### Integrations

- [ ] Dataview query support
- [ ] Canvas file manipulation
- [ ] Tasks plugin integration

### Separate Projects (Out of Scope)

- ❌ Semantic search (requires vector DB infrastructure)
- ❌ Plugin mode (different architecture, separate repo)
- ❌ VS Code/Raycast extensions (out of scope for MCP server)
- ❌ Web/Mobile/Desktop apps (platform specific)

---

## 🚧 Known Limitations

### Current Limitations (v1.0.6)

1. **Single vault only** - One Obsidian instance per server (will be fixed in v2.0)
2. **Text search only** - No semantic/AI-powered search (by design for simplicity)
3. **No real-time sync** - Client must re-query for updates (HTTP limitation)

### Not Planned

- Semantic search (infrastructure too heavy)
- Real-time WebSocket (adds complexity, limited value for MCP use case)
- Plugin mode (separate project if needed)

---

## 📊 Success Metrics

### Quality over Quantity

Focus on:

- **Stability**: 0 critical bugs
- **Performance**: < 200ms avg response time (small vaults)
- **UX**: Works out-of-box for 80% users
- **Community**: Responsive to issues/PRs

### Growth (secondary)

| Metric | v1.0 | v2.0 |
|--------|------|------|
| GitHub Stars | 10+ | 100+ |
| npm Downloads/week | 20+ | 200+ |
| Bug Reports | < 3/month | < 5/month |

---

## 🤝 How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md)

**Priority Areas**:

1. Bug reports and fixes
2. Documentation improvements
3. New tool implementations
4. Performance optimizations

---

## 📣 Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas
- **npm**: Package releases

---

**Maintained by**: Community + Claude (AI Assistant)
**License**: MIT
**Status**: 🟢 Active Development
**Philosophy**: MVP-first, community-driven, no overengineering
