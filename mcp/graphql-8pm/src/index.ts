#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import https from "https";

const GRAPHQL_URL = "https://localhost:8443/graphql";

interface GraphQLResponse {
  data?: unknown;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

function graphqlRequest(
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const options: https.RequestOptions = {
      hostname: "localhost",
      port: 8443,
      path: "/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Host": "magento.8pm.me",
      },
      rejectUnauthorized: false, // Allow self-signed certs in dev
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data) as GraphQLResponse);
        } catch {
          reject(new Error(`Failed to parse response (HTTP ${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const server = new Server(
  {
    name: "graphql-8pm",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description:
          "Execute a GraphQL query or mutation against the Magento endpoint (https://localhost:8443/graphql). Returns data and any errors.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "GraphQL query or mutation string",
            },
            variables: {
              type: "object",
              description: "Optional GraphQL variables as a JSON object",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "introspect",
        description:
          "Introspect the GraphQL schema. Without arguments, lists all root query fields. With a type_name, lists all fields on that type.",
        inputSchema: {
          type: "object",
          properties: {
            type_name: {
              type: "string",
              description:
                "Type name to inspect (e.g., 'ProductInterface', 'CategoryTree'). Omit to list all root query fields.",
            },
          },
          required: [],
        },
      },
      {
        name: "get_products",
        description:
          "Get products with pre-selected Archive.org fields. Filters by collection name, SKU, or category ID. Returns show metadata, recording details, and track info.",
        inputSchema: {
          type: "object",
          properties: {
            collection: {
              type: "string",
              description: "Archive.org collection name (e.g., 'Railroad Earth', 'Grateful Dead'). Uses category name lookup to find the matching category ID.",
            },
            sku: {
              type: "string",
              description: "Product SKU to look up a specific recording",
            },
            category_id: {
              type: "string",
              description: "Category ID to filter by",
            },
            page_size: {
              type: "number",
              description: "Number of results to return (default: 5, max: 20)",
            },
            current_page: {
              type: "number",
              description: "Page number for pagination (default: 1)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_category",
        description:
          "Get a category (artist) by ID or URL key, including product count and basic metadata.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Category ID",
            },
            url_key: {
              type: "string",
              description:
                "Category URL key (e.g., 'railroad-earth', 'grateful-dead')",
            },
          },
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query": {
        const query = args?.query as string;
        const variables = args?.variables as Record<string, unknown> | undefined;
        const result = await graphqlRequest(query, variables);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "introspect": {
        const typeName = args?.type_name as string | undefined;

        if (typeName) {
          // Introspect a specific type
          const result = await graphqlRequest(`
            query IntrospectType {
              __type(name: "${typeName}") {
                name
                kind
                description
                fields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
                inputFields {
                  name
                  description
                  type {
                    name
                    kind
                  }
                }
              }
            }
          `);

          if (!result.data) {
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: true,
            };
          }

          const typeData = (result.data as Record<string, unknown>).__type as Record<string, unknown> | null;
          if (!typeData) {
            return {
              content: [{ type: "text", text: `Type '${typeName}' not found in schema` }],
              isError: true,
            };
          }

          return {
            content: [
              { type: "text", text: JSON.stringify(typeData, null, 2) },
            ],
          };
        } else {
          // List all root query fields
          const result = await graphqlRequest(`
            query IntrospectRoot {
              __schema {
                queryType {
                  fields {
                    name
                    description
                    args {
                      name
                      type {
                        name
                        kind
                        ofType {
                          name
                          kind
                        }
                      }
                    }
                    type {
                      name
                      kind
                      ofType {
                        name
                        kind
                      }
                    }
                  }
                }
              }
            }
          `);

          if (!result.data) {
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: true,
            };
          }

          const schema = (result.data as Record<string, unknown>).__schema as Record<string, unknown>;
          const queryType = schema.queryType as Record<string, unknown>;
          const fields = queryType.fields as Array<{ name: string; description: string }>;
          const fieldList = fields.map((f) => `${f.name}${f.description ? ` - ${f.description}` : ""}`);

          return {
            content: [
              {
                type: "text",
                text: `Root query fields (${fields.length} total):\n\n${fieldList.join("\n")}`,
              },
            ],
          };
        }
      }

      case "get_products": {
        const collection = args?.collection as string | undefined;
        const sku = args?.sku as string | undefined;
        let categoryId = args?.category_id as string | undefined;
        const pageSize = Math.min((args?.page_size as number) || 5, 20);
        const currentPage = (args?.current_page as number) || 1;

        // Resolve collection name to category_id via categoryList lookup
        if (collection && !categoryId) {
          const catResult = await graphqlRequest(`
            query FindArtistCategory {
              categoryList(filters: {name: {match: "${collection.replace(/"/g, '\\"')}"}}) {
                id
                name
              }
            }
          `);
          const cats = ((catResult.data as Record<string, unknown>)?.categoryList as Array<{id: number; name: string}>) ?? [];
          // Pick the best match (exact name match preferred)
          const exact = cats.find(c => c.name.toLowerCase() === collection.toLowerCase());
          const match = exact ?? cats[0];
          if (match) {
            categoryId = String(match.id);
          }
        }

        // Build filter
        const filters: string[] = [];
        if (sku) filters.push(`sku: {eq: "${sku}"}`);
        if (categoryId) filters.push(`category_id: {eq: "${categoryId}"}`);

        const filterStr = filters.length > 0 ? `filter: {${filters.join(", ")}}` : "";

        const query = `
          query GetProducts {
            products(
              ${filterStr}
              pageSize: ${pageSize}
              currentPage: ${currentPage}
            ) {
              total_count
              items {
                sku
                name
                url_key
                archive_collection
                show_year
                show_date
                show_venue
                show_location
                identifier
                song_title
                archive_downloads
                archive_avg_rating
                archive_num_reviews
                show_taper
                lineage
                notes
                categories {
                  id
                  name
                  url_key
                }
              }
            }
          }
        `;

        const result = await graphqlRequest(query);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      }

      case "get_category": {
        const id = args?.id as number | undefined;
        const urlKey = args?.url_key as string | undefined;

        if (!id && !urlKey) {
          return {
            content: [
              { type: "text", text: "Provide either id or url_key" },
            ],
            isError: true,
          };
        }

        // Build the filter for categoryList
        const filterParts: string[] = [];
        if (id) filterParts.push(`ids: {eq: "${id}"}`);
        if (urlKey) filterParts.push(`url_key: {eq: "${urlKey}"}`);
        const filter = filterParts.join(", ");

        const query = `
          query GetCategory {
            categoryList(filters: {${filter}}) {
              id
              name
              url_key
              url_path
              description
              product_count
              image
              children {
                id
                name
                url_key
                product_count
              }
            }
          }
        `;

        const result = await graphqlRequest(query);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
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

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GraphQL 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
