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

1. **[Obsidian](https://obsidian.md/)** - The note-taking app
2. **[Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)** - Install from Obsidian Community Plugins
3. **Node.js** 18+ - [Download here](https://nodejs.org/)
4. **npm** - Comes with Node.js

### Installation

```bash
npm install -g obsidian-http-mcp
```

### Configuration

#### Step 1: Install & Configure Obsidian Plugin

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search "Local REST API" → Install → Enable
3. Settings → Local REST API:
   - **Enable "Non encrypted (HTTP) API"** (required for localhost)
   - Copy the API key
   - Verify port 27123 is shown

#### Step 2: Configure the server

```powershell
# Windows PowerShell
Copy-Item .env.example .env
notepad .env
```

```bash
# Linux/Mac
cp .env.example .env
nano .env
```

Your `.env` should look like:

```env
OBSIDIAN_API_KEY=your_actual_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

#### Step 3: Start the server

```bash
npm run dev
# Server will start on http://localhost:3000
```

#### Step 4: Connect Claude Code CLI

```bash
# Add HTTP MCP server
claude mcp add --transport http obsidian http://localhost:3000/mcp
```

#### Step 5: Test the connection

```bash
claude mcp list
# Should show: obsidian: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

#### Step 6: Use with Claude Code CLI/codex or any other ClI

Start a conversation and your MCP tools will be available:

```bash
claude
# Tools are accessible via /mcp command
# Or Claude will automatically suggest them based on your requests
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

### Advanced: Command Line Arguments

If you prefer command-line arguments over `.env`:

```bash
obsidian-http-mcp --api-key YOUR_KEY --port 3000
```

See `obsidian-http-mcp --help` for all options.

## 🏗️ Architecture

```text
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

## 🔧 Advanced Configuration

Running on Windows/WSL2? Multiple configuration options available:
- All on Windows
- Server on Windows + CLI on WSL2
- Server on WSL2 + CLI on WSL2

See [CONFIGURATION.md](./CONFIGURATION.md) for detailed setup instructions and troubleshooting.

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

## Built with ❤️ for the Obsidian + AI community
