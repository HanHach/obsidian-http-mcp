# Docker Setup Guide

> **Run obsidian-http-mcp in a container for isolated, portable deployment**

This guide covers deploying the Obsidian HTTP MCP server using Docker and Docker Compose.

---

## Prerequisites

- **Docker** and **Docker Compose** installed ([Get Docker](https://docs.docker.com/get-docker/))
- **[Obsidian](https://obsidian.md/)** with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) configured
- **Obsidian API key** (from plugin settings)

---

## Important Limitations

**Claude Desktop is NOT currently supported** - Claude Desktop does not support local HTTP transports at this time. This Docker deployment only works with:

- **Claude Code CLI** (fully supported)
- **Other MCP clients** that support HTTP transports (Codex, Gemini, etc.)

---

## Quick Start

### 1. Configure Obsidian Local REST API Plugin

**CRITICAL**: Before running the Docker container, you must configure the Obsidian plugin:

1. Open Obsidian Settings → Community Plugins → Local REST API
2. **Enable "Non encrypted (HTTP) Server"**
3. Go to **Advanced Settings**
4. Set **Binding Host** to `0.0.0.0` (allows Docker container to connect)
5. **Restart Obsidian** for changes to take effect
6. **Keep Obsidian running** - the MCP server requires Obsidian to be open and the REST API plugin active

**Why 0.0.0.0?** By default, the plugin only listens on `127.0.0.1` (localhost), which Docker containers cannot access. Setting it to `0.0.0.0` allows connections from the Docker bridge network.

### 2. Clone or Navigate to Project

```bash
cd /path/to/obsidian-http-mcp
```

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.docker.example .env
```

Edit `.env` with your settings:

```env
OBSIDIAN_API_KEY=[YOUR_OBSIDIAN_API_KEY]
OBSIDIAN_BASE_URL=http://host.docker.internal:27123
PORT=3000
```

**Important**: Use `host.docker.internal:27123` for `OBSIDIAN_BASE_URL` to access Obsidian running on your host machine from within the container.

### 4. Build and Start

```bash
docker compose build
docker compose up -d
```

The server will be running at `http://localhost:3000/mcp`

### 5. Verify Health

```bash
docker compose ps
```

Look for `healthy` status. You can also check the health endpoint:

```bash
curl http://localhost:3000/health
```

---

## Connecting Your AI Client

### Claude Code CLI

```bash
claude mcp add -s user --transport http obsidian-http http://localhost:3000/mcp
```

Then start using Claude:

```bash
claude
# Try: "List all folders in my Obsidian vault"
```

---

## Docker Compose Commands

### View Logs

```bash
# Follow logs in real-time
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100
```

### Stop Server

```bash
docker compose down
```

### Restart Server

```bash
docker compose restart
```

### Rebuild After Code Changes

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Check Container Status

```bash
docker compose ps
```

---

## Configuration Details

### Docker Compose Configuration

The `docker-compose.yml` includes:

- **Port mapping**: `3000:3000` (host:container)
- **Host access**: `host.docker.internal` allows container to reach host services
- **Auto-restart**: Container restarts automatically unless stopped manually
- **Health checks**: Verifies server is responding every 30 seconds
- **Environment**: Loads configuration from `.env` file

### Dockerfile Architecture

Multi-stage build for optimized image size:

1. **Build stage**: Compiles TypeScript to JavaScript
2. **Deploy stage**: Production image with only runtime dependencies
3. **Security**: Runs as non-root user (`nodejs`)
4. **Updates**: Automatically patches OS packages during build

---

## Network Architectures

### Same Machine Deployment

When Docker and Obsidian run on the same machine:

```
┌─────────────────────────────────────┐
│ Host Machine                        │
│                                     │
│  ┌──────────────┐   port 27123      │
│  │  Obsidian    │◄──────────┐       │
│  │  REST API    │           │       │
│  └──────────────┘           │       │
│                             │       │
│  ┌──────────────────────────┴─────┐ │
│  │ Docker Container               │ │
│  │                                │ │
│  │  MCP Server :3000              │ │
│  │  (uses host.docker.internal)   │ │
│  └────────────────────────────────┘ │
│         ▲                           │
│         │ port 3000                 │
│  ┌──────┴───────┐                   │
│  │ Claude Code  │                   │
│  │ CLI          │                   │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

### Cross-Platform (WSL2 ↔ Windows)

When Docker runs on WSL2, Obsidian on Windows:

```
┌─────────────────────────────────────┐
│ Windows Host                        │
│                                     │
│  ┌──────────────┐                   │
│  │  Obsidian    │                   │
│  │  REST API    │                   │
│  │  :27123      │                   │
│  └──────────────┘                   │
│         ▲                           │
└─────────┼───────────────────────────┘
          │ Windows IP (e.g., 172.19.32.1)
┌─────────┼───────────────────────────┐
│ WSL2    │                           │
│         │                           │
│  ┌──────┴──────────────────────────┐│
│  │ Docker Container                ││
│  │                                 ││
│  │  MCP Server :3000               ││
│  │  (connects via Windows IP)      ││
│  └─────────────────────────────────┘│
│         ▲                           │
│         │ localhost:3000            │
│  ┌──────┴───────┐                   │
│  │ Claude Code  │                   │
│  │ CLI          │                   │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

**For WSL2**: Update `.env` with your Windows IP:

```bash
# Find Windows IP from WSL2
ip route show | grep -i default | awk '{ print $3}'
```

Then update `OBSIDIAN_BASE_URL=http://YOUR_WINDOWS_IP:27123`

---

## Troubleshooting

### Container Can't Connect to Obsidian

**Symptoms**: MCP server starts but can't reach Obsidian API

**Check**:

1. **Ensure Obsidian is running** - The application must be open for the REST API to work
2. Verify Obsidian Local REST API plugin is enabled and running
3. Confirm **Binding Host** is set to `0.0.0.0` in plugin Advanced Settings (restart Obsidian after changing)
4. Confirm API key in `.env` matches Obsidian settings
5. Test connectivity from container:

```bash
docker compose exec obsidian-http-mcp sh -c "wget -O- http://host.docker.internal:27123"
```

### Port 3000 Already in Use

**Solution**: Change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

Then reconnect your AI client:

```bash
claude mcp add -s user --transport http obsidian-http http://localhost:3001/mcp
```

### Container Unhealthy Status

**Check logs**:

```bash
docker compose logs obsidian-http-mcp
```

Common causes:
- Missing or invalid `OBSIDIAN_API_KEY` in `.env`
- Obsidian REST API not accessible from container
- Port conflicts

### WSL2 Firewall Issues

If running Docker on WSL2 with Obsidian on Windows:

**On Windows PowerShell (as Administrator)**:

```powershell
New-NetFirewallRule -DisplayName "Obsidian REST API" -Direction Inbound -LocalPort 27123 -Protocol TCP -Action Allow
```

---

## Security Considerations

**Default configuration is for LOCAL/TRUSTED networks only.**

For production deployment:

- Add reverse proxy with authentication (nginx/Caddy)
- Enable HTTPS/TLS
- Configure rate limiting
- Restrict network access using Docker networks
- See [SECURITY.md](./SECURITY.md) for full security checklist

**Never expose port 3000 directly to the Internet without proper authentication and encryption.**

---

## Advanced Configuration

### Custom Network

Create an isolated Docker network:

```bash
docker network create obsidian-network
```

Update `docker-compose.yml`:

```yaml
services:
  obsidian-http-mcp:
    # ... existing config ...
    networks:
      - obsidian-network

networks:
  obsidian-network:
    external: true
```

### Resource Limits

Add resource constraints to `docker-compose.yml`:

```yaml
services:
  obsidian-http-mcp:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### Persistent Logging

Mount a volume for logs:

```yaml
services:
  obsidian-http-mcp:
    # ... existing config ...
    volumes:
      - ./logs:/app/logs
```

---

## Comparison: Docker vs Native

| Aspect | Docker | Native (`npm install -g`) |
|--------|--------|---------------------------|
| **Setup** | Requires Docker | Node.js only |
| **Isolation** | Full container isolation | Runs in host environment |
| **Updates** | Rebuild image | `npm install -g obsidian-http-mcp@latest` |
| **Portability** | Highly portable | Platform-dependent |
| **Resource usage** | Higher (container overhead) | Lower (native process) |
| **Best for** | Production, multi-environment | Development, simple setups |

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/NasAndNora/obsidian-http-mcp/issues)
- **General troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **Technical details**: [TECHNICAL.md](./TECHNICAL.md)

---

Docker support built with ❤️ for the Obsidian + AI community by Ken C. Soukup, Vigorous Programming.
