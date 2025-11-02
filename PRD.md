# Product Requirements Document (PRD)
# Obsidian HTTP MCP Server

**Version**: 1.0
**Date**: 2025-11-02
**Status**: Active Development

---

## 🎯 Vision

**Create the only HTTP-native MCP server for Obsidian that solves the stdio bug plaguing Claude Code CLI users.**

### Success Metrics

1. **GitHub Stars**: 100+ in first month
2. **npm Downloads**: 500+ weekly
3. **User Satisfaction**: 0 stdio-related bug reports
4. **Adoption**: Top 3 Obsidian MCP on GitHub search

---

## 🧩 Problem Statement

### Current Pain Points

1. **All 150+ Obsidian MCP servers use stdio**
   - Triggers Claude Code CLI bug #3071
   - BrokenPipeError on connection
   - Users frustrated, abandon MCP

2. **Workarounds are complex**
   - `mcp-remote` bridges add complexity
   - Manual bridging configs confuse users
   - No official solution

3. **Market Gap**
   - Zero HTTP-native Obsidian MCP exists
   - Huge demand (Claude Code CLI user base growing)

---

## 👥 Target Users

### Primary Personas

1. **Claude Code CLI Power User**
   - Uses Claude daily for coding
   - Has Obsidian vault for notes
   - Hit stdio bug, looking for solution

2. **Multi-LLM Developer**
   - Uses Claude + Codex + Gemini
   - Wants unified Obsidian access
   - Values stability over features

3. **Knowledge Worker**
   - Non-technical Obsidian user
   - Wants AI to read/write notes
   - Needs simple installation

---

## 🏆 Core Value Propositions

1. **It Actually Works** - No stdio bugs, period
2. **Dead Simple** - 3 commands to install and run
3. **Universal** - Works with any MCP client (Claude/Codex/Gemini)
4. **Fast** - HTTP is faster than stdio pipes
5. **Maintainable** - Clean architecture, TypeScript, documented

---

## ✨ Features

### MVP (v1.0) - Must Have

#### MCP Tools (7 total)

1. **list_dir**
   - Input: `path` (optional, default: root)
   - Output: Array of directory names
   - Use case: Browse vault structure

2. **list_files**
   - Input: `path` (optional), `extension` (optional)
   - Output: Array of file objects (name, path, modified)
   - Use case: Get notes in a folder

3. **read_file**
   - Input: `path` (required)
   - Output: File content (markdown) + metadata
   - Use case: Read note content

4. **write_file**
   - Input: `path`, `content`, `mode` (create/overwrite/append)
   - Output: Success confirmation
   - Use case: Create or update notes

5. **search**
   - Input: `query` (text or regex), `case_sensitive` (bool)
   - Output: Array of matches (file, line, content)
   - Use case: Grep-like search

6. **move_file**
   - Input: `source_path`, `dest_path`
   - Output: Success confirmation
   - Use case: Reorganize vault

7. **delete_file**
   - Input: `path`, `confirm` (bool)
   - Output: Success confirmation
   - Use case: Clean up notes

#### Server Requirements

- HTTP server on configurable port (default: 3000)
- `/mcp` endpoint implementing MCP protocol
- `/health` endpoint for monitoring
- Environment variable configuration
- CLI with `--help`, `--version`, `--port`, `--api-key`

#### Quality Requirements

- **Performance**: < 100ms response time per tool call
- **Reliability**: 99.9% uptime (no crashes)
- **Security**: API key validation, no vault exposure
- **Compatibility**: Node.js 18+, Obsidian REST API 3.0+

### v1.1 - Should Have

- Frontmatter manipulation tools
- Tag management tools
- Batch operations (bulk move/delete)
- Web UI for testing tools

### v2.0 - Nice to Have

- WebSocket support for real-time updates
- Plugin mode (run as Obsidian plugin)
- Built-in vault caching for performance
- Advanced search (fuzzy, semantic)

---

## 🎨 User Experience

### Installation Flow

```
User → npm install -g obsidian-http-mcp
     → Get API key from Obsidian
     → obsidian-http-mcp --api-key XXX
     → Add to ~/.claude.json
     → claude mcp list
     → ✓ Connected!
```

**Time to value**: < 5 minutes

### Error Handling

- Clear error messages with fix suggestions
- Auto-detect common misconfigurations
- Helpful logs (not verbose unless --debug)

---

## 🏗️ Technical Architecture

### Stack

- **Language**: TypeScript (type safety + maintainability)
- **Runtime**: Node.js (compatibility with npm ecosystem)
- **HTTP Server**: Express (MCP SDK compatible)
- **MCP SDK**: @modelcontextprotocol/sdk v1.20.2 (official, StreamableHTTPServerTransport)
- **HTTP Client**: axios (Obsidian REST API calls)
- **Protocol**: Streamable HTTP (MCP spec 2025-03-26)

### Project Structure

```
src/
├── index.ts          # Server entry point
├── cli.ts            # CLI argument parsing
├── client/
│   └── obsidian.ts   # Obsidian REST API client
├── server/
│   └── http.ts       # HTTP + MCP endpoint
├── tools/
│   ├── list.ts       # list_dir + list_files
│   ├── read.ts       # read_file
│   ├── write.ts      # write_file
│   ├── search.ts     # search
│   ├── move.ts       # move_file
│   └── delete.ts     # delete_file
├── types/
│   └── index.ts      # Shared types
└── utils/
    └── config.ts     # Config loading
```

### API Design

**Obsidian REST API Integration**:
- Base URL: `http://127.0.0.1:27123`
- Auth: API key in `Authorization` header
- Endpoints used:
  - `GET /vault/` - List files
  - `GET /vault/{path}` - Read file
  - `POST /vault/{path}` - Write file
  - `PATCH /vault/{path}` - Update file
  - `DELETE /vault/{path}` - Delete file

---

## 🚦 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Obsidian REST API changes | High | Low | Pin compatible version, add version check |
| MCP protocol changes | Medium | Medium | Use official SDK, monitor updates |
| Competition launches HTTP MCP | Low | Low | First-mover advantage, quality focus |
| Performance issues at scale | Medium | Low | Implement caching, optimize queries |

---

## 📊 Success Criteria

### Launch (Week 1)

- [ ] 0 critical bugs
- [ ] Works with Claude Code CLI
- [ ] Complete documentation
- [ ] 10+ GitHub stars

### Growth (Month 1)

- [ ] 100+ GitHub stars
- [ ] 500+ npm downloads
- [ ] 5+ positive user testimonials
- [ ] Mentioned in 3+ blog posts

### Maturity (Month 3)

- [ ] 500+ GitHub stars
- [ ] 2000+ npm downloads
- [ ] Community PRs accepted
- [ ] Featured on MCP showcase

---

## 🗓️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed timeline.

---

**Product Owner**: Claude (AI Assistant)
**Stakeholder**: User (GitHub stars + experience benefit)
**Approval Status**: ✅ Approved for development
