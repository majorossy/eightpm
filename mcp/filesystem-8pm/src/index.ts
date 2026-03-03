#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CONTAINER = "8pm-phpfpm-1";
const LOG_DIR = "/var/www/html/var/log";
const METADATA_DIR = "/var/www/html/var/archivedotorg/metadata";

// Validation: only alphanumeric, dots, underscores, hyphens
const SAFE_NAME_RE = /^[a-zA-Z0-9._-]+$/;

function validateName(value: string, label: string): string | null {
  if (!value || !SAFE_NAME_RE.test(value)) {
    return `Invalid ${label}. Only alphanumeric characters, dots, underscores, and hyphens are allowed. No path separators.`;
  }
  return null;
}

async function containerExec(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(
    `docker exec ${CONTAINER} ${cmd}`,
    { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
  );
}

const server = new Server(
  {
    name: "filesystem-8pm",
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
        name: "list_logs",
        description:
          "List available Magento log files in var/log/ with their sizes and last modified time.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "read_log",
        description:
          "Read the tail of a Magento log file. Common logs: exception.log, system.log, debug.log, support_report.log, cron.log. Returns last N lines (default 50, max 500).",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Log filename, e.g. exception.log (just the filename, not full path)",
            },
            lines: {
              type: "number",
              description:
                "Number of lines to return (default 50, max 500)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "list_metadata",
        description:
          "List Archive.org metadata artists and show counts. If artist is specified, lists show JSON files for that artist.",
        inputSchema: {
          type: "object",
          properties: {
            artist: {
              type: "string",
              description:
                "Artist folder name (e.g., railroadearth, gratefuldead). Omit to list all artists.",
            },
          },
          required: [],
        },
      },
      {
        name: "read_metadata",
        description:
          "Read a specific show's metadata JSON from Archive.org. Returns the full metadata object including tracks, recording info, and show details.",
        inputSchema: {
          type: "object",
          properties: {
            artist: {
              type: "string",
              description: "Artist folder name (e.g., railroadearth)",
            },
            show: {
              type: "string",
              description:
                "Show filename WITHOUT .json extension (e.g., gd1977-05-08.mtx.seamons.23661)",
            },
          },
          required: ["artist", "show"],
        },
      },
      {
        name: "search_logs",
        description:
          "Search log files for a pattern using grep. Returns matching lines with context.",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "Grep pattern to search for",
            },
            log: {
              type: "string",
              description:
                "Which log file to search (default: exception.log)",
            },
            lines_context: {
              type: "number",
              description:
                "Lines of context around each match (default 2, max 10)",
            },
            max_matches: {
              type: "number",
              description:
                "Max number of matches to return (default 20)",
            },
          },
          required: ["pattern"],
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
      case "list_logs": {
        const { stdout } = await containerExec(
          `ls -lah --time-style=long-iso ${LOG_DIR}/`
        );
        const lines = stdout.trim().split("\n");
        // Skip the "total" line, parse each file entry
        const files: { name: string; size: string; date: string }[] = [];
        for (const line of lines) {
          // Match lines like: -rw-r--r-- 1 www-data www-data 1.2M 2026-01-30 14:22 exception.log
          const match = line.match(
            /^[^ ]+\s+\d+\s+\S+\s+\S+\s+(\S+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+)$/
          );
          if (match && match[3] && !match[3].startsWith(".")) {
            files.push({
              name: match[3],
              size: match[1],
              date: match[2],
            });
          }
        }
        // Sort by date descending (newest first)
        files.sort((a, b) => b.date.localeCompare(a.date));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      case "read_log": {
        const logName = args?.name as string;
        const err = validateName(logName, "log filename");
        if (err) {
          return { content: [{ type: "text", text: err }], isError: true };
        }
        let lines = (args?.lines as number) || 50;
        if (lines < 1) lines = 1;
        if (lines > 500) lines = 500;
        try {
          const { stdout } = await containerExec(
            `tail -n ${lines} ${LOG_DIR}/${logName}`
          );
          return {
            content: [{ type: "text", text: stdout }],
          };
        } catch (error) {
          // File not found — list available logs
          const { stdout: lsOut } = await containerExec(
            `ls ${LOG_DIR}/`
          );
          return {
            content: [
              {
                type: "text",
                text: `File "${logName}" not found. Available log files:\n${lsOut}`,
              },
            ],
            isError: true,
          };
        }
      }

      case "list_metadata": {
        const artist = args?.artist as string | undefined;
        if (artist) {
          const err = validateName(artist, "artist name");
          if (err) {
            return { content: [{ type: "text", text: err }], isError: true };
          }
          const { stdout } = await containerExec(
            `ls ${METADATA_DIR}/${artist}/`
          );
          const files = stdout
            .trim()
            .split("\n")
            .filter((f) => f.endsWith(".json"));
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { artist, show_count: files.length, shows: files },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          // List all artist dirs with counts
          const { stdout } = await containerExec(
            `for dir in ${METADATA_DIR}/*/; do name=$(basename "$dir"); count=$(ls -1 "$dir"*.json 2>/dev/null | wc -l); echo "$name $count"; done`
          );
          const artists = stdout
            .trim()
            .split("\n")
            .filter((l) => l.trim())
            .map((line) => {
              const parts = line.trim().split(/\s+/);
              const cnt = parseInt(parts[parts.length - 1], 10) || 0;
              const nm = parts.slice(0, parts.length - 1).join(" ");
              return { name: nm, show_count: cnt };
            })
            .sort((a, b) => b.show_count - a.show_count);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(artists, null, 2),
              },
            ],
          };
        }
      }

      case "read_metadata": {
        const artist = args?.artist as string;
        const show = args?.show as string;
        const errA = validateName(artist, "artist name");
        if (errA) {
          return { content: [{ type: "text", text: errA }], isError: true };
        }
        const errS = validateName(show, "show name");
        if (errS) {
          return { content: [{ type: "text", text: errS }], isError: true };
        }
        const { stdout } = await containerExec(
          `cat ${METADATA_DIR}/${artist}/${show}.json`
        );
        // Parse and re-stringify for pretty printing
        let parsed: unknown;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          // Return raw if JSON parse fails
          return {
            content: [{ type: "text", text: stdout }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(parsed, null, 2),
            },
          ],
        };
      }

      case "search_logs": {
        const pattern = args?.pattern as string;
        if (!pattern) {
          return {
            content: [{ type: "text", text: "Pattern is required." }],
            isError: true,
          };
        }
        const logFile = (args?.log as string) || "exception.log";
        const err = validateName(logFile, "log filename");
        if (err) {
          return { content: [{ type: "text", text: err }], isError: true };
        }
        let linesContext = (args?.lines_context as number) || 2;
        if (linesContext < 0) linesContext = 0;
        if (linesContext > 10) linesContext = 10;
        let maxMatches = (args?.max_matches as number) || 20;
        if (maxMatches < 1) maxMatches = 1;
        if (maxMatches > 100) maxMatches = 100;
        const headLines = maxMatches * (linesContext * 2 + 2);
        // Escape single quotes in pattern for shell safety
        const safePattern = pattern.replace(/'/g, "'\\''");
        try {
          const { stdout } = await containerExec(
            `grep -n -C ${linesContext} '${safePattern}' ${LOG_DIR}/${logFile} | head -n ${headLines}`
          );
          return {
            content: [{ type: "text", text: stdout || "No matches found." }],
          };
        } catch (error) {
          // grep returns exit code 1 for no matches
          const msg =
            error instanceof Error ? error.message : String(error);
          if (msg.includes("exit code 1") || msg.includes("No such file")) {
            if (msg.includes("No such file")) {
              const { stdout: lsOut } = await containerExec(
                `ls ${LOG_DIR}/`
              );
              return {
                content: [
                  {
                    type: "text",
                    text: `File "${logFile}" not found. Available log files:\n${lsOut}`,
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: `No matches found for pattern '${pattern}' in ${logFile}.`,
                },
              ],
            };
          }
          throw error;
        }
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
  console.error("Filesystem 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
