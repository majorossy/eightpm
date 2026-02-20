#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import http from "http";

function opensearchRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : "";
    const options: http.RequestOptions = {
      hostname: "localhost",
      port: 9201,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(
            new Error(
              `Failed to parse response (HTTP ${res.statusCode}): ${data.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const server = new Server(
  {
    name: "opensearch-8pm",
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
        name: "get_health",
        description:
          "Get OpenSearch cluster health status (green/yellow/red), number of nodes, shards, and pending tasks.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "list_indices",
        description:
          "List all OpenSearch indices with their health, status, document count, and store size. Optionally filter by name pattern.",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description:
                "Optional index name pattern (e.g., magento2_*). Omit to list all indices.",
            },
          },
          required: [],
        },
      },
      {
        name: "get_index_stats",
        description:
          "Get detailed statistics for a specific index: document count, store size, indexing/search rate, and shard info.",
        inputSchema: {
          type: "object",
          properties: {
            index: {
              type: "string",
              description: "Index name (e.g., magento2_product_1_v3)",
            },
          },
          required: ["index"],
        },
      },
      {
        name: "get_mappings",
        description:
          "Get field mappings for an index. Shows all fields, their types, and whether they are indexed. Useful for understanding what data is stored.",
        inputSchema: {
          type: "object",
          properties: {
            index: {
              type: "string",
              description: "Index name (e.g., magento2_product_1_v3)",
            },
          },
          required: ["index"],
        },
      },
      {
        name: "search",
        description:
          "Execute an OpenSearch query against an index. Pass a standard OpenSearch query DSL object. Returns hits with _source and _score.",
        inputSchema: {
          type: "object",
          properties: {
            index: {
              type: "string",
              description:
                "Index name (e.g., magento2_product_1_v3)",
            },
            query: {
              type: "object",
              description:
                'OpenSearch query DSL (e.g., {"match": {"name": "Railroad Earth"}})',
            },
            size: {
              type: "number",
              description:
                "Number of results to return (default 5, max 20)",
            },
            _source: {
              type: "array",
              items: { type: "string" },
              description: "Fields to return (optional, returns all if omitted)",
            },
          },
          required: ["index", "query"],
        },
      },
      {
        name: "get_aliases",
        description:
          "List all index aliases. In Magento, aliases like magento2_product_1 point to versioned indices. Shows which alias maps to which index.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
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
      case "get_health": {
        const result = await opensearchRequest("GET", "/_cluster/health");
        const health = result as Record<string, unknown>;
        const summary = {
          status: health.status,
          cluster_name: health.cluster_name,
          number_of_nodes: health.number_of_nodes,
          active_primary_shards: health.active_primary_shards,
          active_shards: health.active_shards,
          unassigned_shards: health.unassigned_shards,
          pending_tasks: health.number_of_pending_tasks,
          initializing_shards: health.initializing_shards,
          relocating_shards: health.relocating_shards,
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "list_indices": {
        const pattern = args?.pattern as string | undefined;
        const path = pattern
          ? `/_cat/indices/${encodeURIComponent(pattern)}?format=json&h=index,health,status,docs.count,store.size&s=index`
          : `/_cat/indices?format=json&h=index,health,status,docs.count,store.size&s=index`;
        const result = await opensearchRequest("GET", path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_index_stats": {
        const index = args?.index as string;
        if (!index || !/^[a-zA-Z0-9_.*-]+$/.test(index)) {
          return {
            content: [
              {
                type: "text",
                text: "Invalid index name. Only alphanumeric characters, underscores, hyphens, dots, and asterisks are allowed.",
              },
            ],
            isError: true,
          };
        }
        const result = await opensearchRequest(
          "GET",
          `/${encodeURIComponent(index)}/_stats`
        );
        const stats = result as Record<string, unknown>;
        const total = (stats._all as Record<string, unknown>)
          ?.total as Record<string, unknown>;
        if (!total) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }
        const docs = total.docs as Record<string, number>;
        const store = total.store as Record<string, unknown>;
        const indexing = total.indexing as Record<string, number>;
        const searchStats = total.search as Record<string, number>;
        const summary = {
          total_docs: docs?.count,
          deleted_docs: docs?.deleted,
          store_size: store?.size_in_bytes,
          indexing_total: indexing?.index_total,
          indexing_failed: indexing?.index_failed,
          search_query_total: searchStats?.query_total,
          search_fetch_total: searchStats?.fetch_total,
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "get_mappings": {
        const index = args?.index as string;
        if (!index || !/^[a-zA-Z0-9_.*-]+$/.test(index)) {
          return {
            content: [
              {
                type: "text",
                text: "Invalid index name. Only alphanumeric characters, underscores, hyphens, dots, and asterisks are allowed.",
              },
            ],
            isError: true,
          };
        }
        const result = await opensearchRequest(
          "GET",
          `/${encodeURIComponent(index)}/_mapping`
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search": {
        const index = args?.index as string;
        if (!index || !/^[a-zA-Z0-9_.*-]+$/.test(index)) {
          return {
            content: [
              {
                type: "text",
                text: "Invalid index name. Only alphanumeric characters, underscores, hyphens, dots, and asterisks are allowed.",
              },
            ],
            isError: true,
          };
        }
        const query = args?.query as Record<string, unknown>;
        if (!query) {
          return {
            content: [
              {
                type: "text",
                text: "Query is required. Provide an OpenSearch query DSL object.",
              },
            ],
            isError: true,
          };
        }
        let size = (args?.size as number) || 5;
        if (size > 20) size = 20;
        if (size < 1) size = 1;
        const sourceFields = args?._source as string[] | undefined;

        const body: Record<string, unknown> = { query, size };
        if (sourceFields && sourceFields.length > 0) {
          body._source = sourceFields;
        }

        const result = await opensearchRequest(
          "POST",
          `/${encodeURIComponent(index)}/_search`,
          body
        );
        const searchResult = result as Record<string, unknown>;
        const hits = searchResult.hits as Record<string, unknown>;
        const summary = {
          total: (hits?.total as Record<string, unknown>)?.value,
          max_score: hits?.max_score,
          hits: ((hits?.hits as unknown[]) || []).map((h: unknown) => {
            const hit = h as Record<string, unknown>;
            return {
              _index: hit._index,
              _id: hit._id,
              _score: hit._score,
              _source: hit._source,
            };
          }),
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "get_aliases": {
        const result = await opensearchRequest("GET", "/_aliases");
        const aliases = result as Record<
          string,
          { aliases: Record<string, unknown> }
        >;
        const mapping: Record<string, string[]> = {};
        for (const [indexName, indexData] of Object.entries(aliases)) {
          const aliasNames = Object.keys(indexData.aliases || {});
          if (aliasNames.length > 0) {
            for (const alias of aliasNames) {
              if (!mapping[alias]) {
                mapping[alias] = [];
              }
              mapping[alias].push(indexName);
            }
          }
        }
        // Also show indices with no aliases
        const indicesWithoutAliases = Object.keys(aliases).filter(
          (indexName) =>
            Object.keys(aliases[indexName].aliases || {}).length === 0
        );
        const output: Record<string, unknown> = {
          alias_to_index: mapping,
        };
        if (indicesWithoutAliases.length > 0) {
          output.indices_without_aliases = indicesWithoutAliases;
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
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
  console.error("OpenSearch 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
