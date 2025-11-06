# Multi-Vault Support Design (v1.1) ( NEED TO BE REVIEWED )

**Status**: Future Feature | **Target**: v1.1.0 | **Current**: v1.0.6

---

## Problem Statement

Users have multiple Obsidian vaults (Personal, Work, etc.), each with different API keys. Current implementation only supports single vault.

**User pain points:**

1. Need to run multiple server instances (different ports)
2. Configure multiple MCP servers in Claude Code
3. Manual vault switching

---

## Chosen Architecture: Path-Based Routing (Solution A)

### Core Concept

### Single Server, Multiple Vault Clients

Path-based routing:

```text
http://localhost:3000/mcp/personal/... → Vault "personal" (API key AAA)
http://localhost:3000/mcp/work/...     → Vault "work" (API key BBB)
http://localhost:3000/mcp/...          → Default vault
```

### Why This Approach

✅ **Explicit routing** - No AI context guessing, zero ambiguity
✅ **Simple implementation** - Express router with `:vault` param
✅ **Performance** - +10ms overhead (negligible)
✅ **Cross-platform** - Works on Windows/Mac/Linux
✅ **Debuggable** - Clear logs showing vault selection

### Rejected Alternatives

- Systemd/service (Linux-only)
- Obsidian plugin (massive effort, dependency risk)
- Context detection (unreliable, 15% error rate)

---

## Configuration Format

**`~/.obsidian-mcp/config.json`:**

```json
{
  "version": "1.1.0",
  "vaults": {
    "personal": {
      "api_key": "xxx-personal-key-xxx",
      "base_url": "http://127.0.0.1:27123",
      "description": "Personal notes and diary"
    },
    "work": {
      "api_key": "yyy-work-key-yyy",
      "base_url": "http://127.0.0.1:27124",
      "description": "Work projects and meetings"
    }
  },
  "default": "personal"
}
```

---

## User Workflows

### Setup (One-Time)

```bash
# Interactive multi-vault setup
obsidian-http-mcp --setup-vaults

> Found Obsidian instances:
  1. Personal (port 27123)
  2. Work (port 27124)

> Configure vault 1 (Personal):
  API key: xxx
  Set as default? (Y/n): y

> Configure vault 2 (Work):
  API key: yyy

✅ Saved 2 vaults to ~/.obsidian-mcp/config.json
```

### Daily Usage Option 1: Multiple MCP Servers (Recommended)

```bash
# Start server once
obsidian-http-mcp

# Configure Claude Code with two distinct MCP servers
claude mcp add --transport http obsidian-personal http://localhost:3000/mcp/personal
claude mcp add --transport http obsidian-work http://localhost:3000/mcp/work

# Claude Code will show both:
# - obsidian-personal (personal vault tools)
# - obsidian-work (work vault tools)
```

**User experience:**

- Claude sees two separate MCP servers
- Tools automatically scoped to correct vault
- Clear separation in `/mcp` list

### Daily Usage Option 2: Single MCP Server

```bash
# Start server
obsidian-http-mcp

# Single MCP server
claude mcp add --transport http obsidian http://localhost:3000/mcp

# Tools use default vault unless path specifies vault
read_file(path="work/meeting.md")  # Uses work vault
read_file(path="diary.md")         # Uses default (personal)
```

---

## Technical Implementation

### Router Architecture

```javascript
class VaultRouter {
  constructor(config) {
    this.clients = new Map();

    // Create one ObsidianClient per vault
    for (const [name, vault] of Object.entries(config.vaults)) {
      this.clients.set(name, new ObsidianClient(vault.base_url, vault.api_key));
    }

    this.defaultVault = config.default;
  }

  getClient(vaultName) {
    const client = this.clients.get(vaultName || this.defaultVault);
    if (!client) {
      throw new Error(`Vault not found: ${vaultName}`);
    }
    return client;
  }
}
```

### Express Routes

```javascript
// Multi-vault endpoint
app.post('/mcp/:vault', async (req, res) => {
  const { vault } = req.params;
  const client = router.getClient(vault);

  console.log(`→ Using vault: ${vault}`);

  const transport = new StreamableHTTPServerTransport({...});
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Default vault endpoint (backward compatible)
app.post('/mcp', async (req, res) => {
  const client = router.getClient(); // Uses default
  // ... same as above
});
```

### Tool Path Resolution

```javascript
// Tools automatically prefix paths with vault if needed
async function readFile(client, args) {
  // If path doesn't contain vault prefix, use default
  let path = args.path;

  // Path analysis for multi-vault routing
  // Example: "work/meeting.md" → vault="work", path="meeting.md"
  const match = path.match(/^(\w+)\/(.*)/);
  if (match && vaults.has(match[1])) {
    const [_, vault, filePath] = match;
    client = router.getClient(vault);
    path = filePath;
  }

  return client.readFile(path);
}
```

---

## Migration Path (v1.0 → v1.1)

### Backward Compatibility

**Single vault config (v1.0.x) still works:**

```json
{
  "api_key": "xxx",
  "base_url": "http://127.0.0.1:27123"
}
```

Automatically migrated to:

```json
{
  "vaults": {
    "default": {
      "api_key": "xxx",
      "base_url": "http://127.0.0.1:27123"
    }
  },
  "default": "default"
}
```

### Upgrade Command

```bash
obsidian-http-mcp --upgrade

> Detected v1.0 config (single vault)
> Migrate to v1.1 multi-vault? (Y/n): y

> Current vault name: default
> Add another vault? (y/N): y

> Vault name: work
> API key: yyy
> Base URL: http://127.0.0.1:27124

✅ Migrated to multi-vault config
```

---

## CLI Changes (v1.1)

### New Flags

```bash
--setup-vaults          Interactive multi-vault setup
--list-vaults           Show configured vaults
--add-vault <name>      Add a new vault
--remove-vault <name>   Remove a vault
--upgrade               Migrate v1.0 config to v1.1
```

### Examples

```bash
# Add vault manually
obsidian-http-mcp --add-vault work
> API key: yyy
> Base URL: http://127.0.0.1:27124
✅ Added vault: work

# List vaults
obsidian-http-mcp --list-vaults
> Configured vaults:
  - personal (default) - http://127.0.0.1:27123
  - work - http://127.0.0.1:27124
```

---

## Health Checks & Monitoring

```javascript
// Periodic health check for all vaults
setInterval(async () => {
  for (const [name, client] of router.clients) {
    try {
      await client.ping();
      console.log(`✓ Vault ${name}: healthy`);
    } catch (error) {
      console.error(`✗ Vault ${name}: unhealthy - ${error.message}`);
    }
  }
}, 60000); // Every minute
```

---

## Security Considerations

1. **API keys storage**: `~/.obsidian-mcp/config.json` with 0600 permissions
2. **Vault isolation**: Each client has separate auth, no cross-vault access
3. **Path validation**: Prevent `../../` traversal across vaults

---

## Performance Impact

- **Routing overhead**: ~10ms per request (negligible)
- **Memory**: +50MB per additional vault (ObsidianClient instance)
- **Startup time**: +100ms for config loading

---

## Future Enhancements (v1.2+)

- Auto-discovery of running Obsidian instances
- Vault aliases (e.g., "personal" = "life" = "notes")
- Vault switching via chat command: *"switch to work vault"*
- Health dashboard: `http://localhost:3000/dashboard`

---

## Implementation Checklist

- [ ] Update `config.ts` to support multi-vault format
- [ ] Implement `VaultRouter` class
- [ ] Add `/mcp/:vault` route
- [ ] Update all tool handlers to use router
- [ ] Add `--setup-vaults` CLI command
- [ ] Add `--upgrade` migration command
- [ ] Update README with multi-vault setup
- [ ] Add integration tests for vault routing
- [ ] Update TECHNICAL.md with architecture diagrams

---

**Last Updated**: 2025-11-06
**Author**: Nas (Obsidian HTTP MCP Team)
