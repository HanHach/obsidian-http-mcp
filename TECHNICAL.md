# Technical Specification
# Obsidian HTTP MCP Server

**Version**: 1.0
**Last Updated**: 2025-11-02

---

## 🏗️ Architecture Overview

### System Design

```
┌──────────────────────────────────────┐
│         MCP Clients                  │
│  (Claude Code CLI, Codex, Gemini)    │
└──────────┬───────────────────────────┘
           │
           │ HTTP Request (POST /mcp)
           │ Content-Type: application/json
           ↓
┌──────────────────────────────────────┐
│    Obsidian HTTP MCP Server          │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  Express HTTP Server           │  │
│  │  - Port: 3000 (configurable)   │  │
│  │  - Routes: /mcp, /health       │  │
│  └────────┬───────────────────────┘  │
│           │                           │
│  ┌────────▼───────────────────────┐  │
│  │  MCP SDK Server                │  │
│  │  StreamableHTTPServerTransport │  │
│  │  - Auto-discovery              │  │
│  │  - Protocol: 2025-03-26        │  │
│  └────────┬───────────────────────┘  │
│           │                           │
│  ┌────────▼───────────────────────┐  │
│  │  MCP Protocol Handler          │  │
│  │  - tools/list                  │  │
│  │  - tools/call                  │  │
│  │  - resources/list (future)     │  │
│  └────────┬───────────────────────┘  │
│           │                           │
│  ┌────────▼───────────────────────┐  │
│  │  Tool Executor                 │  │
│  │  - list_dir                    │  │
│  │  - list_files                  │  │
│  │  - read_file                   │  │
│  │  - write_file                  │  │
│  │  - search                      │  │
│  │  - move_file                   │  │
│  │  - delete_file                 │  │
│  └────────┬───────────────────────┘  │
│           │                           │
│  ┌────────▼───────────────────────┐  │
│  │  Obsidian REST API Client      │  │
│  │  - HTTP client (axios)         │  │
│  │  - Auth: Bearer token          │  │
│  │  - Base URL: 127.0.0.1:27123   │  │
│  └────────┬───────────────────────┘  │
└───────────┼───────────────────────────┘
            │
            │ REST API Calls
            ↓
┌──────────────────────────────────────┐
│   Obsidian Local REST API Plugin     │
│   - Port: 27123 (HTTP)               │
│   - Port: 27124 (HTTPS)              │
└──────────┬───────────────────────────┘
           │
           │ Direct File Access
           ↓
┌──────────────────────────────────────┐
│        Obsidian Vault                 │
│        (Markdown Files)               │
└──────────────────────────────────────┘
```

---

## 📁 Project Structure

```
obsidian-http-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── cli.ts                # CLI argument parser
│   │
│   ├── client/
│   │   └── obsidian.ts       # Obsidian REST API client
│   │
│   ├── server/
│   │   └── http.ts           # HTTP server + MCP endpoint
│   │
│   ├── tools/
│   │   ├── list.ts           # list_dir + list_files
│   │   ├── read.ts           # read_file
│   │   ├── write.ts          # write_file
│   │   ├── search.ts         # search
│   │   ├── move.ts           # move_file
│   │   └── delete.ts         # delete_file
│   │
│   ├── types/
│   │   └── index.ts          # Shared TypeScript types
│   │
│   └── utils/
│       └── config.ts         # Configuration loader
│
├── dist/                     # Compiled JavaScript (gitignored)
├── node_modules/             # Dependencies (gitignored)
│
├── package.json              # npm configuration
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Example environment variables
├── .gitignore
│
├── README.md                 # User documentation
├── PRD.md                    # Product requirements
├── ROADMAP.md                # Development roadmap
├── TECHNICAL.md              # This file
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT license
```

---

## 🔧 Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.21.2 | HTTP server (MCP SDK compatible) |
| `@modelcontextprotocol/sdk` | ^1.20.2 | Official MCP SDK with StreamableHTTPServerTransport |
| `axios` | ^1.13.1 | HTTP client for Obsidian API |
| `dotenv` | ^17.2.3 | Environment variable loading |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.9.3 | Type checking |
| `@types/node` | ^24.9.2 | Node.js types |
| `@types/express` | ^5.0.0 | Express types |
| `tsx` | ^4.20.6 | TypeScript execution |

### Runtime Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **OS**: Linux, macOS, Windows (WSL2)

### MCP Protocol

- **Spec Version**: 2025-03-26 (Streamable HTTP)
- **Transport**: `StreamableHTTPServerTransport`
- **Endpoint**: POST `/mcp` (single endpoint for all operations)

---

## 🔌 API Specifications

### MCP Protocol Implementation

**Endpoint**: `POST /mcp`

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "Notes/example.md"
    }
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# Example Note\n\nThis is the content..."
      }
    ]
  }
}
```

### Tool Specifications

#### 1. `list_dir`

**Description**: List subdirectories in a path

**Input**:
```typescript
{
  path?: string;  // Optional, default: root
}
```

**Output**:
```typescript
{
  directories: string[];  // Array of directory names
}
```

**Obsidian API Call**: `GET /vault/{path}/`

---

#### 2. `list_files`

**Description**: List files in a directory

**Input**:
```typescript
{
  path?: string;        // Optional, default: root
  extension?: string;   // Optional, filter by extension (e.g., "md")
}
```

**Output**:
```typescript
{
  files: Array<{
    name: string;
    path: string;
    size: number;
    modified: string;  // ISO 8601 timestamp
  }>;
}
```

**Obsidian API Call**: `GET /vault/{path}/`

---

#### 3. `read_file`

**Description**: Read content of a file

**Input**:
```typescript
{
  path: string;  // Required
}
```

**Output**:
```typescript
{
  content: string;      // Markdown content
  frontmatter?: object; // YAML frontmatter (if present)
  modified: string;     // ISO 8601 timestamp
}
```

**Obsidian API Call**: `GET /vault/{path}`

---

#### 4. `write_file`

**Description**: Create or update a file

**Input**:
```typescript
{
  path: string;              // Required
  content: string;           // Required
  mode: "create" | "overwrite" | "append";  // Default: "create"
}
```

**Output**:
```typescript
{
  success: boolean;
  path: string;
  message: string;
}
```

**Obsidian API Calls**:
- Create: `PUT /vault/{path}`
- Overwrite: `PUT /vault/{path}` (with existing file check)
- Append: `PATCH /vault/{path}`

---

#### 5. `search`

**Description**: Search for text across all files

**Input**:
```typescript
{
  query: string;               // Required
  case_sensitive?: boolean;    // Default: false
  regex?: boolean;             // Default: false
  max_results?: number;        // Default: 100
}
```

**Output**:
```typescript
{
  matches: Array<{
    file: string;
    line: number;
    content: string;    // Line content with match
    context_before?: string;
    context_after?: string;
  }>;
  total_matches: number;
}
```

**Implementation**:
1. List all files
2. Read each file
3. Perform regex/text search
4. Return matches with context

---

#### 6. `move_file`

**Description**: Move or rename a file

**Input**:
```typescript
{
  source: string;      // Required
  destination: string; // Required
  overwrite?: boolean; // Default: false
}
```

**Output**:
```typescript
{
  success: boolean;
  old_path: string;
  new_path: string;
  message: string;
}
```

**Obsidian API Calls**:
1. Read source file: `GET /vault/{source}`
2. Write to destination: `PUT /vault/{destination}`
3. Delete source: `DELETE /vault/{source}`

---

#### 7. `delete_file`

**Description**: Delete a file

**Input**:
```typescript
{
  path: string;        // Required
  confirm?: boolean;   // Default: false (requires true)
}
```

**Output**:
```typescript
{
  success: boolean;
  deleted_path: string;
  message: string;
}
```

**Obsidian API Call**: `DELETE /vault/{path}`

**Safety**: Requires `confirm: true` to prevent accidental deletions

---

## 🔐 Security Considerations

### API Key Handling

1. **Storage**: Never commit API keys to git
2. **Loading**: Environment variables or `.env` file
3. **Validation**: Check API key format on startup
4. **Transmission**: HTTPS only for remote connections

### Input Validation

- **Path Traversal**: Validate paths don't escape vault
- **Regex Injection**: Sanitize regex patterns in search
- **File Size**: Limit read/write to reasonable sizes (< 10MB)

### Error Handling

- **Never expose vault paths** in error messages
- **Sanitize error responses** to MCP clients
- **Log security events** (failed auth, suspicious paths)

---

## ⚡ Performance Targets

### Response Times

| Operation | Target | Max |
|-----------|--------|-----|
| list_dir | < 50ms | 100ms |
| list_files | < 100ms | 200ms |
| read_file | < 50ms | 150ms |
| write_file | < 100ms | 300ms |
| search | < 500ms | 2000ms |
| move_file | < 200ms | 500ms |
| delete_file | < 100ms | 200ms |

### Scalability

- **Small vault** (< 1000 files): All ops < 100ms
- **Medium vault** (1000-5000 files): Search < 1s
- **Large vault** (5000+ files): Search < 3s

**Future optimization** (v2.1): In-memory caching for < 50ms on all ops

---

## 🧪 Testing Strategy

### Unit Tests

- Each tool function isolated
- Mock Obsidian API responses
- Edge cases (empty vault, special chars, large files)

### Integration Tests

- Full MCP request/response cycle
- Real Obsidian REST API (test vault)
- Error scenarios (network, auth, not found)

### Manual Testing

- Claude Code CLI integration
- Multiple concurrent requests
- Large file operations
- Search performance on big vaults

---

## 🚀 Deployment

### npm Package

```bash
npm run build   # Compile TypeScript
npm publish     # Publish to npm registry
```

### Global Installation

```bash
npm install -g obsidian-http-mcp
obsidian-http-mcp --version
```

### Docker (Future)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

---

## 🐛 Debugging

### Enable Debug Logs

```bash
DEBUG=obsidian-http-mcp:* obsidian-http-mcp
```

### Common Issues

1. **"Connection refused"**
   - Check Obsidian REST API is running
   - Verify port 27123 is open

2. **"Unauthorized"**
   - Check API key is correct
   - Verify API key format (no extra spaces)

3. **"File not found"**
   - Check path uses forward slashes
   - Verify file exists in vault

---

## 📚 References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Obsidian Local REST API Docs](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Hono Documentation](https://hono.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Maintained by**: Claude (AI Assistant)
**Last Review**: 2025-11-02
