# Contributing to Obsidian HTTP MCP

Thank you for your interest in contributing! This guide will help you set up your development environment.

## Prerequisites

- **Git**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Obsidian** with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) configured

## Development Setup

### STEP 1: Fork & Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_GITHUB_USERNAME/obsidian-http-mcp.git
cd obsidian-http-mcp
```

### STEP 2: Install Dependencies

```bash
npm install
```

### STEP 3: Configure Environment

#### Option A (Recommended): Interactive setup

```bash
npm run build
node dist/cli.js --setup
# Enter your Obsidian API key when prompted
```

#### Option B: Using .env file

Create `.env` for local development:

```bash
cp .env.example .env
```

Same machine:

```env
OBSIDIAN_API_KEY=your_actual_api_key_here
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
PORT=3000
```

WSL2 (dev on WSL2, Obsidian on Windows):

```env
OBSIDIAN_API_KEY=your_actual_api_key_here
OBSIDIAN_BASE_URL=http://YOUR_WINDOWS_IP:27123
PORT=3000
```

Find Windows IP: `ipconfig | findstr "vEthernet"` on Windows PowerShell

### STEP 4: Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000` with hot reload.

### STEP 5: Connect Claude CLI for Testing

#### Option 1: Same machine

```bash
claude mcp add -s user --transport http obsidian-dev http://localhost:3000/mcp
```

#### Option 2: Cross-platform (Claude on WSL2, Obsidian on Windows)

1. Find Windows IP on **Windows PowerShell**:

```powershell
ipconfig | findstr "vEthernet"
```

1. Connect from **WSL2":

```bash
claude mcp add -s user --transport http obsidian-dev http://YOUR_WINDOWS_IP:3000/mcp
```

Verify:

```bash
claude mcp list
# Should show: obsidian-dev: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

## Development Workflow

### Build & Test

```bash
# Compile TypeScript
npm run build

# Run tests (coming soon)
npm run test

# Type check
npx tsc --noEmit
```

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions focused and testable

### Making Changes

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test thoroughly:
   - Verify server starts without errors
   - Test with Claude Code CLI
   - Check all 11 MCP tools still work

4. Commit your changes:

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. Push and create a Pull Request:

   ```bash
   git push origin feature/your-feature-name
   ```

## Project Structure

```text
src/
├── server/http.ts          # Express + MCP SDK endpoint
├── client/obsidian.ts      # HTTP client to Obsidian API
├── tools/                  # 11 MCP tools
│   ├── list.ts, read.ts, write.ts, search.ts
│   ├── move.ts, delete.ts, find.ts
│   ├── fileinfo.ts, directory.ts
├── types/
│   ├── tools.ts            # Tool argument interfaces
│   └── index.ts            # Core types
└── utils/
    ├── search.ts           # Fuzzy matching
    ├── batch.ts            # Concurrent processing
    └── config.ts           # .env loader
```

## Adding a New Tool

1. Create tool file in `src/tools/`
2. Add types to `src/types/tools.ts`
3. Register in `src/server/http.ts`:
   - Add to `ListToolsRequestSchema` handler
   - Add to `CallToolRequestSchema` handler
4. Update `TECHNICAL.md` with tool specification
5. Add tests

## Pull Request Guidelines

- **Title**: Use conventional commits format (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Description**: Explain what and why (not how)
- **Testing**: Describe how you tested the changes
- **Breaking changes**: Clearly mark any breaking changes

## Questions?

Open an issue or start a discussion on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
