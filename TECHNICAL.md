# Technical Specification

**Version**: 1.0.6 | **Updated**: 2025-11-06

---

## Stack

- **Server**: Express 5 + MCP SDK (StreamableHTTPServerTransport)
- **Client**: axios → Obsidian REST API (port 27123)
- **Protocol**: MCP 2025-03-26
- **Runtime**: Node.js 18+

## 11 MCP Tools

| Tool | Purpose | Performance |
|------|---------|-------------|
| `list_dir` | List subdirectories | ~30ms |
| `list_files` | List files in directory | ~50ms |
| `find_files` | Fuzzy file search (60s cache) | ~10ms cached |
| `read_file` | Read file content | ~30ms |
| `write_file` | Create/update/append file | ~80ms |
| `search` | Full-text search (regex) | 2-3s (1000 files) |
| `move_file` | Move/rename file | ~150ms |
| `delete_file` | Delete file (soft delete) | ~80ms |
| `delete_folder` | Delete folder recursively | Batched (20 concurrent) |
| `get_file_info` | File metadata (size, modified) | ~30ms |
| `create_directory` | Create directory | ~60ms |

**Notes:**

- Soft delete → `.trash-http-mcp/` by default
- Search: batched parallel (20 concurrent reads)
- Find: fuzzy matching with Levenshtein distance

---

## Performance Optimizations

**v1.0 improvements:**

- Search: 50s → 2-3s (96% faster via batched parallel reads)
- Fuzzy: 500ms → 50ms (90% faster via filtered subset)
- Cache: 60s TTL on file listings (70% fewer API calls)

**Bottlenecks:**

- Large vault search: limited by Obsidian API latency (~50ms/file)
- No indexing (by design for simplicity)

## Security

**Implemented:**

- ✅ Path traversal protection (URL decoding validation)
- ✅ ReDoS protection (500 char query limit)
- ✅ PORT validation (1-65535 range)
- ✅ Type safety (strict TypeScript, no `as any`)
- ✅ Request size limit (10MB body-parser)

**User responsibility** (trusted network design):

- Authentication (use reverse proxy)
- Rate limiting (nginx/cloudflare)
- HTTPS/TLS (reverse proxy)
- Firewall rules

See [SECURITY.md](./SECURITY.md) for deployment checklist.

## Configuration (v1.0.2+)

**Priority chain:**

1. CLI args (`--api-key`, `--port`)
2. Environment variables (`OBSIDIAN_API_KEY`)
3. Config file (`~/.obsidian-mcp/config.json`)
4. .env file

**Setup wizard:**

```bash
obsidian-http-mcp --setup
```

Config saved to `~/.obsidian-mcp/config.json` (0600 permissions).

## Development

```bash
npm run dev    # Watch mode
npm run build  # Compile TypeScript
npm start      # Production mode
```

**Project structure:**

```text
src/
├── server/http.ts          # Express + MCP endpoint
├── client/obsidian.ts      # Obsidian API client
├── tools/                  # 11 MCP tools
├── utils/                  # Config, search, batch processing
└── types/                  # TypeScript interfaces
```

## Dependencies

**Runtime:**

- `express` - HTTP server
- `@modelcontextprotocol/sdk` - Official MCP SDK
- `axios` - HTTP client
- `dotenv` - Environment variables

**Zero dependencies added in v1.0.2** (Node.js built-ins only).

## References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Obsidian REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Full tool specs](https://github.com/NasAndNora/obsidian-http-mcp/tree/master/src/tools)

---

**Maintained by**: Nas | **License**: MIT
