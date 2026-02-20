#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";

const COMPOSE_FILE = "/Users/chris.majorossy/Education/8pm/compose.yaml";
const CONTAINER = "phpfpm";
const MAGENTO_BIN = "/var/www/html/bin/magento";
const EXEC_TIMEOUT = 120_000; // 120 seconds
const MAX_BUFFER = 10 * 1024 * 1024; // 10MB

// Shell metacharacters that indicate injection attempts
const DANGEROUS_CHARS = /[|&;$`\\><]/;

function runMagento(args: string): Promise<string> {
  const cmd = `docker compose -f ${COMPOSE_FILE} exec -T -u app ${CONTAINER} php ${MAGENTO_BIN} ${args}`;
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: EXEC_TIMEOUT, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
      if (error) {
        const output = stdout ? stdout.trim() : "";
        const errOutput = stderr ? stderr.trim() : "";
        const combined = [output, errOutput, error.message].filter(Boolean).join("\n");
        reject(new Error(combined));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

const server = new Server(
  {
    name: "magento-8pm",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "cache_flush",
        description:
          "Flush Magento cache. Optionally specify cache types (config, layout, block_html, collections, reflection, db_ddl, compiled_config, eav, customer_notification, full_page, config_integration, config_integration_api, target_rule, config_webservice, translate). Flushes all if none specified.",
        inputSchema: {
          type: "object",
          properties: {
            types: {
              type: "array",
              items: { type: "string" },
              description: "Cache types to flush (optional, flushes all if omitted)",
            },
          },
          required: [],
        },
      },
      {
        name: "reindex",
        description:
          "Reindex Magento indexers. Optionally specify indexers. Runs all indexers if none specified. Common indexers: catalog_category_product, catalog_product_category, catalog_product_price, catalogrule_rule, catalogsearch_fulltext, customer_grid, inventory, cataloginventory_stock.",
        inputSchema: {
          type: "object",
          properties: {
            indexers: {
              type: "array",
              items: { type: "string" },
              description: "Indexer names to reindex (optional, reindexes all if omitted)",
            },
          },
          required: [],
        },
      },
      {
        name: "setup_upgrade",
        description:
          "Run bin/magento setup:upgrade to apply pending database schema changes and module configuration. Use after adding or updating modules.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "run_command",
        description:
          "Run any Magento CLI command. Do not include 'bin/magento' prefix — just the command and arguments (e.g., 'module:status', 'deploy:mode:show', 'indexer:status').",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Magento CLI command (without bin/magento prefix)",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "get_config",
        description:
          "Get a Magento configuration value by path (e.g., 'web/secure/base_url', 'catalog/search/engine'). Queries core_config_data via the Magento config:show command.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Configuration path (e.g., 'web/secure/base_url')",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "cache_flush": {
        const types = (args?.types as string[]) || [];
        // Validate each type contains only safe characters
        for (const t of types) {
          if (DANGEROUS_CHARS.test(t)) {
            return {
              content: [{ type: "text", text: "Invalid cache type: contains shell metacharacters." }],
              isError: true,
            };
          }
        }
        const suffix = types.length > 0 ? " " + types.join(" ") : "";
        const result = await runMagento(`cache:flush${suffix}`);
        return {
          content: [{ type: "text", text: result || "Cache flushed successfully." }],
        };
      }

      case "reindex": {
        const indexers = (args?.indexers as string[]) || [];
        for (const idx of indexers) {
          if (DANGEROUS_CHARS.test(idx)) {
            return {
              content: [{ type: "text", text: "Invalid indexer name: contains shell metacharacters." }],
              isError: true,
            };
          }
        }
        const suffix = indexers.length > 0 ? " " + indexers.join(" ") : "";
        const result = await runMagento(`indexer:reindex${suffix}`);
        return {
          content: [{ type: "text", text: result || "Reindex completed successfully." }],
        };
      }

      case "setup_upgrade": {
        const result = await runMagento("setup:upgrade");
        return {
          content: [{ type: "text", text: result || "Setup upgrade completed successfully." }],
        };
      }

      case "run_command": {
        const command = args?.command as string;
        if (!command) {
          return {
            content: [{ type: "text", text: "Missing required parameter: command" }],
            isError: true,
          };
        }
        if (DANGEROUS_CHARS.test(command)) {
          return {
            content: [
              {
                type: "text",
                text: "Command rejected: contains shell metacharacters (|, &, ;, $, `, \\, >, <). Only plain Magento CLI commands are allowed.",
              },
            ],
            isError: true,
          };
        }
        const result = await runMagento(command);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_config": {
        const path = args?.path as string;
        if (!path) {
          return {
            content: [{ type: "text", text: "Missing required parameter: path" }],
            isError: true,
          };
        }
        if (DANGEROUS_CHARS.test(path)) {
          return {
            content: [{ type: "text", text: "Invalid config path: contains shell metacharacters." }],
            isError: true,
          };
        }
        const result = await runMagento(`config:show ${path}`);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Magento 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
