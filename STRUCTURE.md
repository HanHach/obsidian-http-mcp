# STRUCTURE.md - Architecture du projet

## Vue d'ensemble

```
src/
├── index.ts              # Entry point principal
├── cli.ts                # Parse arguments (--port, --api-key, --help)
│
├── types/
│   └── index.ts          # Types TS partagés (Config, ToolResult, etc.)
│
├── utils/
│   └── config.ts         # Load .env + validate config
│
├── client/
│   └── obsidian.ts       # Wrapper axios pour Obsidian REST API (port 27123)
│
├── server/
│   └── http.ts           # Express + MCP SDK StreamableHTTPServerTransport
│
└── tools/
    ├── list.ts           # list_dir + list_files
    ├── read.ts           # read_file
    ├── write.ts          # write_file (create/overwrite/append)
    ├── search.ts         # search (grep-like + regex)
    ├── move.ts           # move_file
    └── delete.ts         # delete_file (avec confirm)
```

## Flow d'exécution

```
1. User: claude mcp list (auto-discovery)
2. Claude CLI → POST http://localhost:3000/mcp
3. Express server → StreamableHTTPServerTransport
4. MCP SDK Server → tools/{tool}.ts (via registered handlers)
5. tools/{tool}.ts appelle client/obsidian.ts
6. client/obsidian.ts → Obsidian REST API (127.0.0.1:27123)
7. Response → tools → MCP SDK → Transport → Claude CLI
```

## Responsabilités par fichier

### `index.ts`
- Import config
- Start HTTP server
- Log "Server running on port 3000"

### `cli.ts`
- Parse process.argv
- Handle --help, --version, --port, --api-key
- Exit si args invalides

### `types/index.ts`
```typescript
export interface Config {
  apiKey: string;
  baseUrl: string;
  port: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

### `utils/config.ts`
- Load .env avec dotenv
- Validate OBSIDIAN_API_KEY existe
- Return Config object

### `client/obsidian.ts`
- axios instance configuré (baseURL, headers, auth)
- Methods: listVault(), readFile(), writeFile(), deleteFile()
- Error handling (404, 401, etc)

### `server/http.ts`
- Express app
- MCP SDK Server instance
- StreamableHTTPServerTransport
- POST /mcp → handleRequest() via transport
- GET /health → { status: "ok" }
- Register tools via server.setRequestHandler()

### `tools/*.ts`
Chaque tool:
1. Valide input (path, params)
2. Appelle client/obsidian.ts
3. Transforme response en format MCP
4. Return ToolResult

## Ordre d'implémentation

1. ✅ types/index.ts (types de base)
2. ✅ utils/config.ts (config loader)
3. ✅ client/obsidian.ts (API client)
4. ✅ tools/*.ts (7 tools)
5. ✅ server/http.ts (HTTP + MCP)
6. ✅ index.ts + cli.ts (entry points)
7. ✅ Test build + run local

## Dépendances critiques

- `express` → server/http.ts (HTTP server)
- `@modelcontextprotocol/sdk` → server/http.ts (StreamableHTTPServerTransport)
- `axios` → client/obsidian.ts
- `dotenv` → utils/config.ts

## Notes importantes

- **Pas de stdio** - Tout HTTP pur (StreamableHTTP MCP 2025-03-26)
- **Port par défaut**: 3000 (configurable)
- **Obsidian API**: Toujours 127.0.0.1:27123 (local only)
- **Sécurité**: API key validée dans client/obsidian.ts
- **Auto-discovery**: Claude CLI détecte automatiquement via MCP SDK
- **Transport**: Une instance StreamableHTTPServerTransport par requête (évite collisions ID)
