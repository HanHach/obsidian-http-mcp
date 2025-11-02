# Configuration Guide - Obsidian HTTP MCP

This guide covers all supported deployment configurations for Windows/WSL2 environments.

## Table of Contents
- [Compatibility Matrix](#compatibility-matrix)
- [Configuration A: All on Windows](#configuration-a-all-on-windows)
- [Configuration B: Server Windows + CLI WSL2](#configuration-b-server-windows--cli-wsl2-tested)
- [Configuration C: Server WSL2 + CLI WSL2](#configuration-c-server-wsl2--cli-wsl2)
- [Troubleshooting](#troubleshooting)
- [Network Architecture](#network-architecture)

---

## Compatibility Matrix

| Obsidian | MCP Server | Claude CLI | OBSIDIAN_BASE_URL | MCP Client URL | Status | Notes |
|----------|------------|------------|-------------------|----------------|--------|-------|
| Windows | Windows | Windows | `127.0.0.1:27123` | `localhost:3000` | ✅ Predicted Working | Simplest setup |
| Windows | Windows | WSL2 | `127.0.0.1:27123` | `172.19.32.1:3000` | ✅ Tested & Working | Cross-platform tested |
| Windows | WSL2 | WSL2 | `172.19.32.1:27123` | `localhost:3000` | ✅ Predicted Working | Bridge required |

**Key Insight**: The `listen(3000, '0.0.0.0')` in the server makes all configurations possible. Only `OBSIDIAN_BASE_URL` and MCP client URL need adjustment.

---

## Configuration A: All on Windows

**Use Case**: Running everything on Windows (no WSL2 involved).

### Architecture
```
┌─────────────────────────┐
│ Windows                 │
│                         │
│  Obsidian:27123        │
│      ↓ localhost        │
│  MCP Server:3000       │
│      ↓ localhost        │
│  Claude CLI:3000       │
└─────────────────────────┘
```

### Setup Instructions

#### 1. Configure .env
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

#### 2. Start MCP Server (PowerShell)
```powershell
npm run dev
# Should show: Server listening on 0.0.0.0:3000
```

#### 3. Add to Claude CLI (PowerShell)
```powershell
claude mcp add -s user --transport http obsidian-http http://localhost:3000/mcp
```

#### 4. Verify
```powershell
# Test MCP server
curl http://localhost:3000/health

# Test Obsidian API
curl http://127.0.0.1:27123/

# Test Claude CLI
claude mcp list
# Should show: obsidian-http: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

### Risk Level: ✅ NONE
- All on same machine
- Direct localhost connections
- No cross-platform networking needed

---

## Configuration B: Server Windows + CLI WSL2 (TESTED)

**Use Case**: Development on WSL2, but server runs on Windows (current tested setup).

### Architecture
```
┌──────────────┐         ┌──────────────┐
│ Windows      │         │ WSL2         │
│              │         │              │
│ Obsidian     │         │ Claude CLI   │
│ :27123       │         │    ↓         │
│      ↑       │         │    |         │
│ MCP Server   │◄────────│ 172.19.32.1  │
│ :3000        │ bridge  │ :3000        │
└──────────────┘         └──────────────┘
```

### Setup Instructions

#### 1. Configure .env (Windows)
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

**Important**: Use `127.0.0.1:27123` because server is on Windows (same as Obsidian).

#### 2. Start MCP Server (Windows PowerShell)
```powershell
npm run dev
# Should show: Server listening on 0.0.0.0:3000 (accessible from WSL2)
```

#### 3. Add to Claude CLI (WSL2)
```bash
claude mcp add -s user --transport http obsidian-http http://172.19.32.1:3000/mcp
```

**Important**: Use `172.19.32.1` from WSL2 to reach Windows services.

#### 4. Verify

**From Windows PowerShell:**
```powershell
# Test MCP server locally
curl http://localhost:3000/health

# Test Obsidian API
curl http://127.0.0.1:27123/
```

**From WSL2:**
```bash
# Test MCP server cross-platform
curl http://172.19.32.1:3000/health

# Test Claude CLI
claude mcp list
# Should show: obsidian-http: http://172.19.32.1:3000/mcp (HTTP) - ✓ Connected
```

### Risk Level: ⚠️ LOW
- **Risk**: Windows bridge IP (`172.19.32.1`) may change after Windows reboot (rare)
- **Risk**: Windows Firewall might block port 3000 from WSL2
- **Mitigation**: Script to detect and update IP if needed

---

## Configuration C: Server WSL2 + CLI WSL2

**Use Case**: Running MCP server on WSL2 for development workflow.

### Architecture
```
┌──────────────┐         ┌──────────────┐
│ Windows      │         │ WSL2         │
│              │         │              │
│ Obsidian     │◄────────│ MCP Server   │
│ :27123       │ bridge  │ :3000        │
└──────────────┘         │      ↓       │
                         │ Claude CLI   │
                         │ localhost    │
                         └──────────────┘
```

### Setup Instructions

#### 1. Configure .env (WSL2)
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://172.19.32.1:27123
PORT=3000
```

**Important**: Use `172.19.32.1:27123` because server is on WSL2 (needs bridge to reach Windows Obsidian).

#### 2. Start MCP Server (WSL2)
```bash
npm run dev
# Should show: Server listening on 0.0.0.0:3000
```

#### 3. Add to Claude CLI (WSL2)
```bash
claude mcp add -s user --transport http obsidian-http http://localhost:3000/mcp
```

**Important**: Use `localhost` because both server and CLI are on WSL2.

#### 4. Verify

**From WSL2:**
```bash
# Test MCP server locally
curl http://localhost:3000/health

# Test Obsidian API via bridge
curl http://172.19.32.1:27123/

# Test Claude CLI
claude mcp list
# Should show: obsidian-http: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

### Risk Level: ⚠️ LOW
- **Risk**: Windows bridge IP may change
- **Risk**: Windows Firewall might block port 27123 from WSL2
- **Mitigation**: Ensure Windows Firewall allows inbound on port 27123

---

## Troubleshooting

### Issue: "Connection refused" from MCP server

**Symptoms**:
```
timeout of 10000ms exceeded
```

**Diagnosis**:
```bash
# Check if Obsidian REST API is accessible
curl -v http://YOUR_OBSIDIAN_URL:27123/

# Check MCP server is running
curl http://YOUR_MCP_URL:3000/health
```

**Solutions**:
1. Verify Obsidian Local REST API plugin is enabled
2. Verify "Non encrypted (HTTP) API" is enabled in plugin settings
3. Check `OBSIDIAN_BASE_URL` matches your server location:
   - Server on Windows → Use `127.0.0.1:27123`
   - Server on WSL2 → Use `172.19.32.1:27123`

### Issue: "No MCP server found" in Claude CLI

**Diagnosis**:
```bash
claude mcp list
# Server shows "Failed to connect"
```

**Solutions**:
1. Check MCP client URL matches your CLI location:
   - CLI on Windows, Server on Windows → `http://localhost:3000/mcp`
   - CLI on WSL2, Server on Windows → `http://172.19.32.1:3000/mcp`
   - CLI on WSL2, Server on WSL2 → `http://localhost:3000/mcp`
2. Ensure server is listening on `0.0.0.0` (check startup log)
3. Test health endpoint: `curl YOUR_MCP_URL:3000/health`

### Issue: Windows Firewall blocking cross-platform access

**Symptoms**: Works on Windows but not from WSL2.

**Solution (Windows PowerShell as Admin)**:
```powershell
# Allow inbound on port 3000 (MCP server)
New-NetFirewallRule -DisplayName "MCP Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow inbound on port 27123 (Obsidian REST API - if server on WSL2)
New-NetFirewallRule -DisplayName "Obsidian REST API" -Direction Inbound -LocalPort 27123 -Protocol TCP -Action Allow
```

### Finding WSL2 Bridge IP

If `172.19.32.1` doesn't work, find the correct IP:

**From WSL2:**
```bash
# Method 1: Check resolv.conf
cat /etc/resolv.conf | grep nameserver
# Output: nameserver 172.19.32.1

# Method 2: Check route
ip route | grep default
# Output: default via 172.19.32.1 dev eth0
```

**From Windows PowerShell:**
```powershell
# Find WSL network adapter
ipconfig | Select-String -Pattern "WSL" -Context 10
```

---

## Network Architecture

### Windows/WSL2 Networking Explained

```
┌─────────────────────────────────────────────────────┐
│ Windows Host (Physical Machine)                     │
│                                                      │
│  127.0.0.1 = Windows localhost                      │
│  172.19.32.1 = WSL2 bridge gateway (Windows side)  │
│                                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ WSL2 Virtual Machine (Hyper-V)            │     │
│  │                                            │     │
│  │  127.0.0.1 = WSL2 localhost               │     │
│  │  172.19.32.1 = Gateway to Windows         │     │
│  │                                            │     │
│  └───────────────────────────────────────────┘     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Key Rules

| From | To | Address | Works? |
|------|----|---------| -------|
| Windows | Windows | `127.0.0.1` | ✅ YES |
| WSL2 | WSL2 | `127.0.0.1` | ✅ YES |
| WSL2 | Windows | `172.19.32.1` | ✅ YES |
| Windows | WSL2 | `127.0.0.1` | ❌ NO (different network) |
| Windows | WSL2 | Complex* | ⚠️ Possible with port forwarding |

\* Windows can reach WSL2 via dynamic IP that changes, or via port forwarding. Not recommended for this project.

### Why `0.0.0.0` Works

When server binds to `0.0.0.0:3000`:
- Listens on ALL network interfaces
- Accessible via `127.0.0.1:3000` (localhost)
- Accessible via `172.19.32.1:3000` (bridge from WSL2)
- Accessible via LAN IP (if needed)

This is why the same server code works in all configurations.

---

## Configuration File Templates

### Windows-only (.env)
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

### Windows Server + WSL2 CLI (.env on Windows)
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

### WSL2 Server + WSL2 CLI (.env on WSL2)
```env
OBSIDIAN_API_KEY=your_api_key_here
OBSIDIAN_BASE_URL=http://172.19.32.1:27123
PORT=3000
```

---

## Quick Decision Tree

**Where do you want to run the MCP server?**

**→ Windows**
- Obsidian is local → Use `OBSIDIAN_BASE_URL=http://127.0.0.1:27123`
- Claude CLI on Windows → Use `http://localhost:3000/mcp`
- Claude CLI on WSL2 → Use `http://172.19.32.1:3000/mcp`

**→ WSL2**
- Obsidian on Windows → Use `OBSIDIAN_BASE_URL=http://172.19.32.1:27123`
- Claude CLI on WSL2 → Use `http://localhost:3000/mcp`
- Claude CLI on Windows → Not recommended (complex IP routing)

---

**Last Updated**: 2025-11-02
**Tested Configuration**: Configuration B (Server Windows + CLI WSL2)
