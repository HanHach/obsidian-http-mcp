# Troubleshooting

Common issues and solutions for Obsidian HTTP MCP.

---

## Connection Issues

### WSL2: Connection refused

**Symptom:** `ECONNREFUSED` when connecting from WSL2 to Windows.

**Solution:** Use Windows bridge IP instead of localhost.

```bash
# Find bridge IP
cat /etc/resolv.conf | grep nameserver
# Output: nameserver 172.19.32.1

# Reconnect Claude CLI with bridge IP
claude mcp add --transport http obsidian http://172.19.32.1:3000/mcp
```

**For Obsidian on Windows, server on WSL2:**
```bash
# In .env or --setup
OBSIDIAN_BASE_URL=http://172.19.32.1:27123
```

---

### Windows Firewall blocks WSL2

**Symptom:** Connection timeout from WSL2 → Windows port 3000.

**Solution:** Add firewall rule for port 3000.

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Obsidian MCP Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

### Port already in use

**Symptom:** `EADDRINUSE: address already in use :::3000`

**Solution 1 - Change port:**
```bash
obsidian-http-mcp --port 3001
```

**Solution 2 - Kill process on port 3000:**
```bash
# Linux/WSL2
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Authentication Issues

### Invalid API key

**Symptom:** `401 Unauthorized` from Obsidian REST API.

**Solution:** Verify API key in Obsidian plugin settings.

1. Obsidian → Settings → Community Plugins → Local REST API
2. Copy the API key exactly (no spaces)
3. Run `obsidian-http-mcp --setup` and paste key

---

### API key not found

**Symptom:** `Error: API key not found. Please run "obsidian-http-mcp --setup"`

**Solution:** Run setup wizard or set environment variable.

```bash
# Option 1: Setup wizard
obsidian-http-mcp --setup

# Option 2: Environment variable
export OBSIDIAN_API_KEY=your_key_here
obsidian-http-mcp

# Option 3: CLI argument
obsidian-http-mcp --api-key your_key_here
```

---

## Server Issues

### Server not responding

**Symptom:** Claude CLI shows "Connection timed out" or server health check fails.

**Checklist:**
1. Is server running? Check terminal for "Server is ready!"
2. Test health endpoint: `curl http://localhost:3000/health`
3. Check firewall rules (Windows)
4. Verify port not blocked by antivirus

**Restart server after reboot:**
```bash
obsidian-http-mcp
# Keep terminal running
```

---

### Obsidian API not accessible

**Symptom:** Server starts but cannot reach Obsidian (ECONNREFUSED to port 27123).

**Solution:** Verify Obsidian REST API plugin is enabled and running.

1. Obsidian → Settings → Community Plugins
2. Enable "Local REST API" plugin
3. Check plugin shows "Server running on port 27123"
4. Test: `curl http://127.0.0.1:27123/` (should return vault info)

---

## Claude CLI Issues

### MCP server not detected

**Symptom:** `claude mcp list` shows server disconnected or missing.

**Solution:** Re-add MCP server.

```bash
# Remove old connection
claude mcp remove obsidian

# Add new connection (adjust URL for your setup)
claude mcp add --transport http obsidian http://localhost:3000/mcp

# Verify
claude mcp list
```

---

### Tools not showing in Claude

**Symptom:** Claude doesn't recognize MCP tools (list_files, read_file, etc.).

**Solution:** Restart Claude CLI session.

```bash
# Exit Claude
exit

# Start new session
claude
# Tools should now be available
```

---

## Network Debugging

### Check server is listening

```bash
# Linux/WSL2
netstat -tuln | grep 3000
# Should show: 0.0.0.0:3000 LISTEN

# Windows
netstat -an | findstr :3000
```

### Test MCP endpoint

```bash
# Should return MCP protocol info
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'
```

### Check Obsidian API

```bash
# Should return vault structure (needs API key)
curl http://127.0.0.1:27123/ \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Still Having Issues?

1. Check [GitHub Issues](https://github.com/NasAndNora/obsidian-http-mcp/issues)
2. Enable verbose logging: `DEBUG=* obsidian-http-mcp`
3. Create new issue with:
   - OS/environment (Windows/WSL2/Linux/Mac)
   - Error message
   - Output of health check
   - Steps to reproduce

---

**Last Updated**: 2025-01-06
