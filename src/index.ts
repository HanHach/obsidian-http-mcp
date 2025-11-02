#!/usr/bin/env node

import { loadConfig } from './utils/config.js';
import { ObsidianClient } from './client/obsidian.js';
import { createHttpServer } from './server/http.js';
import { parseArgs, showHelp, showVersion } from './cli.js';

async function main() {
  const cliArgs = parseArgs(process.argv);

  if (cliArgs.help) {
    showHelp();
    process.exit(0);
  }

  if (cliArgs.version) {
    showVersion();
    process.exit(0);
  }

  // Load config from env + CLI overrides
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error('Error loading config:', error instanceof Error ? error.message : error);
    console.error('\nRun with --help for usage information');
    process.exit(1);
  }

  // CLI args override env vars
  if (cliArgs.apiKey) config.apiKey = cliArgs.apiKey;
  if (cliArgs.port) config.port = cliArgs.port;

  // Create Obsidian client
  const client = new ObsidianClient(config.baseUrl, config.apiKey);

  // Create HTTP server
  const app = createHttpServer(client, config.port);

  // Start server
  console.log(`
Obsidian HTTP MCP Server starting...

Configuration:
  Port: ${config.port}
  Obsidian API: ${config.baseUrl}

MCP Endpoint: http://localhost:${config.port}/mcp
Health Check: http://localhost:${config.port}/health

Add to ~/.claude.json:
{
  "mcpServers": {
    "obsidian": {
      "type": "http",
      "url": "http://localhost:${config.port}/mcp"
    }
  }
}

Server is ready!
  `);

  app.listen(config.port, () => {
    console.log(`\n✓ Server listening on port ${config.port}\n`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
