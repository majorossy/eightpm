#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

// Lazy connection with auto-reconnect
let connection: mysql.Connection | null = null;

async function ensureConnection(): Promise<mysql.Connection> {
  if (connection) {
    try {
      await connection.ping();
      return connection;
    } catch {
      try {
        await connection.end();
      } catch {
        // ignore cleanup errors
      }
      connection = null;
    }
  }
  connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3307,
    user: "magento",
    password: "magento",
    database: "magento",
  });
  return connection;
}

const server = new Server(
  {
    name: "mysql-8pm",
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
        name: "query",
        description: "Execute a SELECT query",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "SQL SELECT query",
            },
            params: {
              type: "array",
              items: {
                type: ["string", "number", "boolean", "null"],
              },
              description: "Query parameters (optional)",
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "execute",
        description: "Execute an INSERT, UPDATE, or DELETE query",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "SQL query (INSERT, UPDATE, DELETE)",
            },
            params: {
              type: "array",
              items: {
                type: ["string", "number", "boolean", "null"],
              },
              description: "Query parameters (optional)",
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "describe_table",
        description: "Get table structure",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name",
            },
          },
          required: ["table"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const conn = await ensureConnection();

    switch (name) {
      case "query": {
        const sql = args?.sql as string;
        const params = (args?.params as unknown[]) || [];
        const [rows] = await conn.query(sql, params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      case "execute": {
        const sql = args?.sql as string;
        const params = (args?.params as unknown[]) || [];
        const [result] = await conn.execute(sql, params);
        const info = result as mysql.ResultSetHeader;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  affectedRows: info.affectedRows,
                  insertId: info.insertId,
                  changedRows: info.changedRows,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_tables": {
        const [rows] = await conn.query("SHOW TABLES");
        const tables = (rows as Record<string, string>[]).map(
          (row) => Object.values(row)[0]
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tables, null, 2),
            },
          ],
        };
      }

      case "describe_table": {
        const table = args?.table as string;
        // Validate table name to prevent injection (only allow alphanumeric and underscores)
        if (!/^[a-zA-Z0-9_]+$/.test(table)) {
          return {
            content: [
              {
                type: "text",
                text: "Invalid table name. Only alphanumeric characters and underscores are allowed.",
              },
            ],
            isError: true,
          };
        }
        const [rows] = await conn.query(`DESCRIBE \`${table}\``);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    // If the error is a connection issue, clear the cached connection
    if (
      error instanceof Error &&
      ("fatal" in error || error.message.includes("ECONNREFUSED") || error.message.includes("PROTOCOL"))
    ) {
      connection = null;
    }
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

// Cleanup on exit
async function cleanup() {
  if (connection) {
    try {
      await connection.end();
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MySQL 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
