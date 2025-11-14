# Obsidian HTTP MCP

> **The first HTTP-native MCP server for Obsidian that solves Claude Code CLI stdio bugs** ([#3071](https://github.com/anthropics/claude-code/issues/3071), [#9176](https://github.com/anthropics/claude-code/issues/9176))

**Also compatible with**: Claude Desktop, Codex, Gemini, and other MCP clients

[![npm version](https://badge.fury.io/js/obsidian-http-mcp.svg)](https://www.npmjs.com/package/obsidian-http-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/NasAndNora/obsidian-http-mcp?style=social)](https://github.com/NasAndNora/obsidian-http-mcp)

## Why This Exists

First HTTP-native MCP server for Obsidian. Solves stdio transport failures (BrokenPipeError) affecting Claude Code CLI. HTTP bypasses these issues entirely.

**Performance**: <200ms response, 70% fewer API calls via intelligent cache

---

## 🚀 Quick Start

> **💡 New to the codebase?** Ask an AI assistant to guide you: *"Based on README.md and TECHNICAL.md, walk me through how the HTTP-native MCP server works"*

### Prerequisites

1. **[Obsidian](https://obsidian.md/)** with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **MCP-compatible AI** (e.g., [Claude Code CLI](https://claude.ai/code), Claude Desktop, Codex, etc.)

### STEP 1: Configure Obsidian Plugin

- Settings → Community Plugins → Search "Local REST API" → Enable
- Enable "Non encrypted (HTTP) API"
- **Copy the API key** (you'll need it next)

### STEP 2: Install & Setup

**Install where Obsidian is installed:**

```bash
npm install -g obsidian-http-mcp
obsidian-http-mcp --setup
# Enter your Obsidian API key when prompted
# Press Enter to accept defaults for URL and port
```

**Config saved to `~/.obsidian-mcp/config.json`** - you won't need to type this again.

> **Cross-platform users:** If your AI runs on WSL2 but Obsidian on Windows, install the server on Windows.

### STEP 3: Start Server

**Where you installed (same system as Obsidian):**

```bash
obsidian-http-mcp
```

**⚠️ Keep this terminal running.** After reboot, run `obsidian-http-mcp` again.

### STEP 4: Connect Your AI

**If your AI runs where the server is installed:**

```bash
claude mcp add -s user --transport http obsidian http://localhost:3000/mcp  # Adapt command to your AI
```

**If your AI runs elsewhere** (e.g., Claude on WSL2, server on Windows):

1. Find server's IP address on **the system where the server runs**:

```powershell
# Windows PowerShell
ipconfig | findstr "vEthernet"

# Linux
ip addr show | grep inet
```

2. Connect from **where your AI runs**:

```bash
claude mcp add -s user --transport http obsidian http://SERVER_IP:3000/mcp  # Adapt command to your AI
```

---

### STEP 5: Use with Your AI

Run where your AI is installed (Windows, Linux, or WSL2):

```bash
claude  # Or your AI CLI command
# Try: "List all folders in my Obsidian vault"
```

**That's it!** Your AI will automatically connect to the server every time you start a conversation (as long as the server is running).

---

## 🔄 Updating

To update to the latest version:

```bash
npm install -g obsidian-http-mcp@latest
```

After updating, restart the server:

```bash
obsidian-http-mcp
```

---

## 🛠️ Features

**12 MCP Tools**: File operations (read/write/edit/move/delete), search, fuzzy find, directory management

**Smart File Search**: Fuzzy matching with typo tolerance, emoji support, 60s cache - solves the problem where AI cannot guess exact filenames

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

**Alternative: Using .env file** (on same system as Obsidian):

1. Create `.env` with `OBSIDIAN_API_KEY=your_key`
2. Run: `obsidian-http-mcp` (Windows PowerShell or Linux terminal)

---

## 🔧 Troubleshooting

### WSL2: Connection refused

**Find your Windows bridge IP:**

On **Windows PowerShell** (not WSL2):

```powershell
ipconfig | findstr "IPv4"
# Look for "vEthernet (WSL)" interface
# Example output: IPv4 Address. . . . . . . . . . . : 172.19.32.1
```

Then reconnect from **WSL2 terminal**:

```bash
claude mcp add -s user --transport http obsidian http://YOUR_IP:3000/mcp
# Replace YOUR_IP with the IP from above
```

> **Why not `127.0.0.1:27123` directly?** Port 27123 is Obsidian's REST API (custom HTTP protocol). Port 3000 is the MCP Server that translates between MCP protocol (used by your AI) and Obsidian's REST API. They are different protocols - the MCP server acts as a translator/proxy.

### Windows Firewall blocks WSL2

Run on **Windows PowerShell as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "MCP Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Port already in use

Run on the same system as Obsidian (Windows PowerShell or Linux terminal):

```bash
obsidian-http-mcp --api-key YOUR_KEY --port 3001
```

**Need more help?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting and [TECHNICAL.md](./TECHNICAL.md) for network architecture.

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
