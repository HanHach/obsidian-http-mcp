# SUIVI - Session 2025-11-02

## Problème découvert

**Status actuel**: Serveur HTTP custom qui imite MCP, mais **pas un vrai MCP server**.

**Symptômes**:
- `claude mcp list` ne détecte pas le serveur
- Besoin de curl manuel pour tester
- SDK MCP (@modelcontextprotocol/sdk) jamais initialisé correctement

**Cause racine**:
- J'ai créé un endpoint HTTP `/mcp` custom avec Hono
- J'ai implémenté manuellement le protocole JSON-RPC MCP
- Je n'ai **pas utilisé** le vrai transport MCP du SDK officiel

## Code problématique

`src/server/http.ts`: Implémentation custom, pas le vrai SDK.

```typescript
// ❌ MAUVAIS - Custom Hono endpoint
app.post('/mcp', async (c) => {
  // Manual JSON-RPC handling
});
```

## Solution attendue

Utiliser le vrai SDK MCP avec **HTTP transport**.

```typescript
// ✅ BON - Vrai SDK MCP
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { HTTPServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
```

## Questions résolues

1. **MCP Server ou MCP Client?**
   - ✅ **Server** (expose des tools à Claude)
   - ❌ Client (consomme des tools - pas notre cas)

2. **HTTP Transport existe dans le SDK?**
   - ✅ **OUI**: `StreamableHTTPServerTransport` depuis SDK v1.20.2
   - Import: `@modelcontextprotocol/sdk/server/streamableHttp.js`
   - Protocole: Streamable HTTP (2025-03-26 spec)

## Solution technique

**Stack final**:
- Express (remplace Hono) - serveur HTTP standard
- `StreamableHTTPServerTransport` - transport MCP officiel
- `Server` du SDK - gestion MCP complète

**Pattern**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const server = new Server({...});
const app = express();

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## Actions

- [x] Relire doc MCP SDK
- [x] Vérifier HTTPServerTransport → `StreamableHTTPServerTransport` trouvé
- [ ] Update TECHNICAL.md (Express + StreamableHTTPServerTransport)
- [ ] Install Express dependency
- [ ] Réécrire src/server/http.ts avec vrai SDK
- [ ] Tester avec `claude mcp list`
- [ ] Valider détection automatique

## Contexte technique

**Env**: WSL2 + Windows
- Serveur tourne sur Windows (localhost:3000)
- Claude CLI sur WSL2 (accès via 172.19.32.1:3000)
- Obsidian REST API sur Windows (localhost:27123)

**Stack**:
- Node.js, TypeScript
- @modelcontextprotocol/sdk v1.20.2
- Hono (peut-être à remplacer si SDK a son propre serveur HTTP)

## Notes

User a raison de questionner. Un vrai MCP server doit être auto-découvert par `claude mcp list`.

Notre implémentation actuelle = hack qui fonctionne en curl, mais pas conforme MCP.
