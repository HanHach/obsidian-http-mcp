# Obsidian HTTP MCP

> **The first and only HTTP-native MCP server for Obsidian that actually works with Claude Code CLI**

[![npm version](https://badge.fury.io/js/obsidian-http-mcp.svg)](https://www.npmjs.com/package/obsidian-http-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Why This Exists

**Problem**: All existing Obsidian MCP servers use `stdio` transport, which triggers [Claude Code CLI bug #3071](https://github.com/anthropics/claude-code/issues/3071) causing `BrokenPipeError` and connection failures.

**Solution**: This is the **only** Obsidian MCP server using pure HTTP transport, bypassing stdio completely. Works flawlessly with:
- ✅ Claude Code CLI
- ✅ Claude Desktop
- ✅ Codex
- ✅ Gemini Code CLI
- ✅ Any MCP client supporting HTTP transport

## 🚀 Quick Start

### Prerequisites

1. **Obsidian** with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed
2. **Node.js** 18+ (already required for Obsidian)

### Installation

```bash
npm install -g obsidian-http-mcp
```

### Configuration

1. **Get your Obsidian API key**:
   - Open Obsidian → Settings → Local REST API
   - Copy the API key

2. **Start the server**:
```bash
obsidian-http-mcp --api-key YOUR_API_KEY --port 3000
```

3. **Connect Claude Code CLI**:
```bash
# Add HTTP MCP server
claude mcp add --transport http obsidian http://localhost:3000/mcp
```

4. **Test it**:
```bash
claude mcp list
# Should show: obsidian: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

## 🛠️ Features

### MCP Tools

| Tool | Description | Example |
|------|-------------|---------|
| `list_dir` | List directories in vault | List all folders |
| `list_files` | List files in a directory | Get notes in /Projects |
| `read_file` | Read note content | Read daily note |
| `write_file` | Create or update note | Create meeting note |
| `search` | Grep-like search in vault | Find "todo" across notes |
| `move_file` | Move/rename notes | Move note to archive |
| `delete_file` | Delete note | Delete draft |

### Why HTTP Native?

**Traditional MCP servers (stdio)**:
```json
{
  "command": "npx",
  "args": ["obsidian-mcp"]
}
```
❌ Spawns subprocess → stdio pipes → BrokenPipeError

**This MCP server (HTTP)**:
```json
{
  "type": "http",
  "url": "http://localhost:3000/mcp"
}
```
✅ Direct HTTP connection → No stdio → No bugs

## 📖 Usage Examples

### With Claude Code CLI

```bash
# Ask Claude to list your notes
"Show me all notes in my Projects folder"

# Search across vault
"Find all mentions of 'AI' in my notes"

# Create a note
"Create a meeting note for today in /Meetings"
```

### Environment Variables

```bash
# .env file
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

```bash
# Start with env file
obsidian-http-mcp
```

## 🏗️ Architecture

```
┌─────────────────┐
│  Claude Code    │
│      CLI        │
└────────┬────────┘
         │ HTTP (StreamableHTTP - MCP 2025-03-26)
         ↓
┌──────────────────────────────┐
│  Obsidian HTTP MCP Server    │ (This project)
│                              │
│  Express + MCP SDK           │
│  StreamableHTTPServerTransport│
│  Port 3000                   │
└────────┬─────────────────────┘
         │ REST API
         ↓
┌─────────────────┐
│   Obsidian      │
│  Local REST API │
│   Port 27123    │
└─────────────────┘
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📝 License

MIT - See [LICENSE](./LICENSE)

## 🌟 Support

If this project helps you, please star it on GitHub!

## 🔗 Related

- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code CLI](https://claude.ai/code)

---

**Built with ❤️ for the Obsidian + AI community**
