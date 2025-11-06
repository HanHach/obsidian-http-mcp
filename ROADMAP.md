# Obsidian HTTP MCP Server - Roadmap

**Last Updated**: 2025-11-06

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

### v1.1 - Multi-vault Support 🔥 NEXT PRIORITY

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

### Usage

```typescript
// Single vault (no vault param needed)
read_file({ path: "note.md" })

// Multi-vault (specify vault)
read_file({ vault: "work", path: "meeting.md" })
```

**Backward compatible**: Existing single-vault configs continue working

**Effort**: ~150 lines, 5 files modified

**Timeline**: 2-3 days

---

### v1.2 - Production Hardening & UX Polish (Week 2)

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

**Timeline**: Community-driven

**Note**: Security features are optional add-ons for users who need public deployment. Current scope (trusted network) remains unchanged.

---

### v1.3 - Quality & Testing (Week 3-4)

**Goal**: Production-ready reliability

**Features**:

- [ ] Unit test suite (tools only)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker support (optional deployment)
- [ ] Performance benchmarks

**Nice-to-have** (if time permits):

- Interactive setup wizard
- Web UI for testing (localhost:3000/ui)

**Timeline**: 2 weeks

---

### v2.0 - Community Features (Month 2+)

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

**Timeline**: Community-driven

---

### v2.1 - Performance Optimization (Month 3)

**Goal**: Optimize for large vaults (5000+ notes)

**Features**:

- [ ] Extend cache TTL options (configurable)
- [ ] Parallel tool execution
- [ ] Response streaming for large files
- [ ] Request queuing

**Note**: In-memory cache already exists (60s TTL in find.ts)

**Timeline**: Based on performance reports

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

1. **Single vault only** - One Obsidian instance per server (will be fixed in v1.1)
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
