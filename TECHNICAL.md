# Technical Specification: Obsidian HTTP MCP Server

**Version**: 1.0  
**Last Updated**: 2025-11-02

---

## 🏗️ Architecture Overview

### System Design

```text
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
│  │  - Base URL: Configurable      │  │
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

```text
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
- **OS**: Linux, macOS, Windows (native or WSL2)

### Network Configuration

- **Server Listen**: `0.0.0.0:3000` (all interfaces, cross-platform accessible)
- **Obsidian API**: Configurable via `OBSIDIAN_BASE_URL` (depends on deployment, see [CONFIGURATION.md](./CONFIGURATION.md))

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

**⚠️ IMPORTANT - Trailing Slash Requirement**:
- **Directories MUST end with `/`**: `BUSINESS/`, `Notes/`, `""` (root)
- **Files MUST NOT have `/`**: `Notes/meeting.md`, `README.md`
- This is an Obsidian REST API requirement enforced by the plugin

---

#### 1. `list_dir`

**Description**: List subdirectories in a path. IMPORTANT: Paths must end with / for directories (e.g., "BUSINESS/" not "BUSINESS")

**Input**:

```typescript
{
  path?: string;  // Directory path WITH trailing slash (e.g., "BUSINESS/" or "")
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

**Description**: List files in a directory. IMPORTANT: Directory paths must end with / (e.g., "Notes/" not "Notes")

**Input**:

```typescript
{
  path?: string;        // Directory path WITH trailing slash (e.g., "Notes/" or "")
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

**Description**: Read content of a file. Use file path WITHOUT trailing slash (e.g., "Notes/meeting.md")

**Input**:

```typescript
{
  path: string;  // File path WITHOUT trailing slash (e.g., "Notes/meeting.md")
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

**Description**: Search for text recursively across entire vault (all subdirectories)

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

**Description**: Delete a file with soft delete by default. Moves to `.trash-http-mcp/` for recovery unless `permanent: true`.

**Input**:

```typescript
{
  path: string;         // Required
  confirm?: boolean;    // Required: must be true (safety check)
  permanent?: boolean;  // Default: false (soft delete to trash)
}
```

**Output**:

```typescript
{
  success: boolean;
  original_path?: string;      // If soft delete
  trash_location?: string;     // If soft delete: .trash-http-mcp/{timestamp}_{filename}
  deleted_path?: string;       // If permanent delete
  message: string;
}
```

**Obsidian API Calls**:
- Soft delete (default): `GET` source → `PUT` trash → `DELETE` source
- Hard delete: `DELETE /vault/{path}`

**Safety**:
- Requires `confirm: true` to prevent accidental deletions
- Soft delete by default protects against AI operation accidents
- Trash format: `.trash-http-mcp/{ISO8601-timestamp}_{filename}`

---

#### 8. `delete_folder`

**Description**: Delete all files in a folder recursively. Soft delete by default (moves to trash). Empty folders remain due to API limitation.

**Input**:

```typescript
{
  path: string;         // Required - Folder path
  confirm?: boolean;    // Required: must be true (safety check)
  permanent?: boolean;  // Default: false (soft delete to trash)
}
```

**Output**:

```typescript
{
  success: boolean;
  moved_files?: number;         // If soft delete
  trash_location?: string;      // If soft delete: .trash-http-mcp/{timestamp}/
  deleted_files?: number;       // If permanent delete
  message: string;
}
```

**Obsidian API Calls**: Multiple `GET` + `PUT` (soft) or `DELETE` (hard) per file

**Implementation**:

1. Recursive scan with `walkVault()`
2. For each file: Read → Write to trash → Delete (soft) or Delete directly (hard)
3. Preserve folder structure in trash: `.trash-http-mcp/{timestamp}/{original/path/file.md}`

**Limitations**:
- Empty folders remain (Obsidian REST API has no folder deletion endpoint)
- Trash format: `.trash-http-mcp/{ISO8601-timestamp}/{folder}/`

---

#### 9. `find_files`

**Description**: Search files by name with fuzzy matching

**Input**:

```typescript
{
  query: string;           // Required - Search query
  fuzzy?: boolean;         // Default: true - Enable typo tolerance
  max_results?: number;    // Default: 10 - Maximum results
}
```

**Output**:

```typescript
{
  success: boolean;
  query: string;
  total_matches: number;
  matches: Array<{
    path: string;          // Full path: "BUSINESS/AI/Note.md"
    score: number;         // 0-1 similarity score
    match_type: 'exact' | 'contains' | 'fuzzy';
  }>;
}
```

**Obsidian API Calls**: Multiple `GET /vault/{path}` (recursive scan)

**Algorithm**:

1. Scan vault recursively (cached 60s)
2. Normalize query (strip emojis, lowercase)
3. Try exact match first
4. Try contains match (case-insensitive)
5. If fuzzy enabled: Levenshtein distance (threshold 0.8)
6. Sort by score, return top N

**Performance**:

- First call: 50 API calls for 50 folders (200-500ms)
- Cached calls: 0 API calls (instant)
- Cache TTL: 60 seconds
- Parallel folder scanning via Promise.all

**Use Case**: Claude cannot guess exact filenames, especially with emojis or special characters. This tool enables discovery before attempting `read_file`.

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

## 🐛 Development Commands

### Available Scripts

```bash
# Development mode (auto-reload on changes)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production mode (requires build first)
npm start
```

### Common Issues

**"Connection refused"**:

```bash
# Check if Obsidian REST API is running
curl http://127.0.0.1:27123/

# Check server is running
curl http://localhost:3000/health
```

**"Module not found"**:

```bash
# Reinstall dependencies (especially after git pull or platform change)
rm -rf node_modules
npm install
```

See [CONFIGURATION.md](./CONFIGURATION.md) for cross-platform troubleshooting (Windows/WSL2).

---

## 📚 References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Obsidian Local REST API Docs](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Maintained by**: Claude (AI Assistant)
**Last Review**: 2025-11-02
