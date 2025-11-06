# Obsidian HTTP MCP

> **The first and only HTTP-native MCP server for Obsidian that actually works with Claude Code CLI**

[![npm version](https://badge.fury.io/js/obsidian-http-mcp.svg)](https://www.npmjs.com/package/obsidian-http-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/NasAndNora/obsidian-http-mcp?style=social)](https://github.com/NasAndNora/obsidian-http-mcp)

## Why This Exists

First HTTP-native MCP server for Obsidian. Solves stdio transport failures in Claude Code CLI ([#3071](https://github.com/anthropics/claude-code/issues/3071), [#9176](https://github.com/anthropics/claude-code/issues/9176) for mcp-obsidian). HTTP bypasses BrokenPipeError issues entirely.

**Works with**: Claude Code CLI, Claude Desktop, Codex, Gemini | **Performance**: <200ms response, 70% fewer API calls via intelligent cache

---

## 🚀 Quick Start

> **💡 New to the codebase?** Ask an AI assistant to guide you: *"Based on README.md and TECHNICAL.md, walk me through how the HTTP-native MCP server works"*

### Prerequisites

1. **[Obsidian](https://obsidian.md/)** with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **[Claude Code CLI](https://claude.ai/code)**

### 1. Configure Obsidian Plugin

- Settings → Community Plugins → Search "Local REST API" → Enable
- Enable "Non encrypted (HTTP) API"
- **Copy the API key** (you'll need it next)

### 2. Install & Setup (one-time)

```bash
npm install -g obsidian-http-mcp
obsidian-http-mcp --setup
# Enter your Obsidian API key when prompted
# Press Enter to accept defaults for URL and port
```

**Config saved to `~/.obsidian-mcp/config.json`** - you won't need to type this again.

### 3. Start Server

```bash
obsidian-http-mcp
```

**⚠️ Keep this terminal running.** Restart after reboot to use the MCP server.

### 4. Connect Claude CLI (one-time setup)

**Same machine (all Windows or all Linux):**

```bash
claude mcp add --transport http obsidian http://localhost:3000/mcp
```

**Cross-platform (Claude on WSL2, Obsidian on Windows):**

```bash
claude mcp add --transport http obsidian http://172.19.32.1:3000/mcp
```

Verify:

```bash
claude mcp list
# Should show: obsidian: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

### 5. Use with Claude

```bash
claude
# Try: "Show me all notes in my Projects folder"
```

**That's it!** Claude will automatically connect to the server every time you start a conversation (as long as the server is running).

---

## 🛠️ Features

**11 MCP Tools**: File operations (read/write/move/delete), search, fuzzy find, directory management

**Smart File Search**: Fuzzy matching with typo tolerance, emoji support, 60s cache - solves the problem where Claude cannot guess exact filenames

**Safe Deletion**: Soft delete to `.trash-http-mcp/` by default (protects against accidental AI operations)

**Coming in v1.1**: Multi-vault support - see [ROADMAP.md](./ROADMAP.md)

See [TECHNICAL.md](./TECHNICAL.md) for complete tool specifications and architecture details.

---

## 📖 Command Line Options

```bash
obsidian-http-mcp --help

Options:
  --setup              Interactive setup (saves to ~/.obsidian-mcp/config.json)
  --api-key <key>      Obsidian REST API key (overrides config)
  --base-url <url>     Obsidian REST API URL (default: http://127.0.0.1:27123)
  --port <port>        Server port (default: 3000)
  --help, -h           Show help
  --version, -v        Show version

Config Priority:
  1. CLI arguments (--api-key, --base-url, --port)
  2. Environment variables (OBSIDIAN_API_KEY, OBSIDIAN_BASE_URL, PORT)
  3. Config file (~/.obsidian-mcp/config.json)
  4. .env file
```

**Alternative: Using .env file**:

1. Create `.env` with `OBSIDIAN_API_KEY=your_key`
2. Run: `obsidian-http-mcp`

---

## 🔧 Troubleshooting

### WSL2: Connection refused

**Find your bridge IP:**

```bash
cat /etc/resolv.conf | grep nameserver
# Use the IP shown (usually 172.19.32.1)
```

Then reconnect:

```bash
claude mcp add --transport http obsidian http://YOUR_IP:3000/mcp
```

### Windows Firewall blocks WSL2

```powershell
# Run as Admin
New-NetFirewallRule -DisplayName "MCP Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Port already in use

```bash
obsidian-http-mcp --api-key YOUR_KEY --port 3001
```

**Need more help?** See [CONFIGURATION.md](./CONFIGURATION.md) for detailed cross-platform setup guides and network architecture.

---

## ⚠️ Security Notice

**Designed for trusted networks** (localhost, LAN, VPN). For production deployment:

- Use reverse proxy (nginx/caddy) with authentication
- Enable HTTPS/TLS
- Configure rate limiting
- See [SECURITY.md](./SECURITY.md) for full checklist

**Current state**: Binds to `0.0.0.0` for cross-platform compatibility (WSL2 ↔ Windows). Do NOT expose directly to the Internet.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

---

## 📝 License

MIT - See [LICENSE](./LICENSE)

---

## 🌟 Support

If this project helps you, please star it on GitHub!

---

## 🔗 Related

- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code CLI](https://claude.ai/code)

---

Built with ❤️ for the Obsidian + AI community
