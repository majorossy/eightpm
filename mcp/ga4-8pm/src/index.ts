#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { AnalyticsAdminServiceClient } from "@google-analytics/admin";

// Configuration from environment
const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CREDENTIALS_PATH = process.env.GA4_CREDENTIALS_PATH;

if (!PROPERTY_ID) {
  console.error("GA4_PROPERTY_ID environment variable is required");
  process.exit(1);
}

if (!CREDENTIALS_PATH) {
  console.error("GA4_CREDENTIALS_PATH environment variable is required");
  process.exit(1);
}

// Initialize clients with service account credentials
const dataClient = new BetaAnalyticsDataClient({
  keyFilename: CREDENTIALS_PATH,
});

const adminClient = new AnalyticsAdminServiceClient({
  keyFilename: CREDENTIALS_PATH,
});

const server = new Server(
  {
    name: "ga4-8pm",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Common dimension/metric references for descriptions
const COMMON_DIMENSIONS = [
  "pagePath",
  "pageTitle",
  "date",
  "city",
  "country",
  "deviceCategory",
  "browser",
  "operatingSystem",
  "sessionSource",
  "sessionMedium",
  "sessionCampaignName",
  "eventName",
  "customEvent:artist_name",
  "customEvent:track_name",
  "hostname",
  "landingPage",
  "pageReferrer",
  "newVsReturning",
  "firstUserSource",
];

const COMMON_METRICS = [
  "screenPageViews",
  "sessions",
  "totalUsers",
  "newUsers",
  "activeUsers",
  "eventCount",
  "averageSessionDuration",
  "bounceRate",
  "engagementRate",
  "engagedSessions",
  "sessionsPerUser",
  "screenPageViewsPerSession",
  "userEngagementDuration",
  "conversions",
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_report",
        description: `Run a custom GA4 report with any dimensions and metrics. Common dimensions: ${COMMON_DIMENSIONS.slice(0, 8).join(", ")}. Common metrics: ${COMMON_METRICS.slice(0, 8).join(", ")}.`,
        inputSchema: {
          type: "object",
          properties: {
            dimensions: {
              type: "array",
              items: { type: "string" },
              description:
                "Dimension names (e.g., ['pagePath', 'date', 'deviceCategory'])",
            },
            metrics: {
              type: "array",
              items: { type: "string" },
              description:
                "Metric names (e.g., ['screenPageViews', 'sessions', 'totalUsers'])",
            },
            start_date: {
              type: "string",
              description:
                "Start date (YYYY-MM-DD, or relative: 'today', 'yesterday', '7daysAgo', '30daysAgo'). Default: '7daysAgo'",
            },
            end_date: {
              type: "string",
              description: "End date (YYYY-MM-DD or 'today'). Default: 'today'",
            },
            dimension_filter: {
              type: "object",
              description:
                'Optional filter object: { dimension: "pagePath", match_type: "CONTAINS"|"EXACT"|"BEGINS_WITH"|"REGEX", value: "/artists" }',
              properties: {
                dimension: { type: "string" },
                match_type: {
                  type: "string",
                  enum: [
                    "EXACT",
                    "BEGINS_WITH",
                    "ENDS_WITH",
                    "CONTAINS",
                    "FULL_REGEXP",
                    "PARTIAL_REGEXP",
                  ],
                },
                value: { type: "string" },
                negate: { type: "boolean" },
              },
            },
            order_by: {
              type: "string",
              description:
                "Metric name to sort by descending (e.g., 'screenPageViews')",
            },
            limit: {
              type: "number",
              description: "Max rows to return (default: 25, max: 250)",
            },
          },
          required: ["metrics"],
        },
      },
      {
        name: "get_realtime",
        description:
          "Get real-time active user data (last 30 minutes). Shows what's happening on the site right now.",
        inputSchema: {
          type: "object",
          properties: {
            dimensions: {
              type: "array",
              items: { type: "string" },
              description:
                "Real-time dimensions (e.g., ['unifiedScreenName', 'city', 'country', 'deviceCategory', 'platform']). Default: none (just total count)",
            },
            metrics: {
              type: "array",
              items: { type: "string" },
              description:
                "Real-time metrics (e.g., ['activeUsers', 'eventCount', 'screenPageViews']). Default: ['activeUsers']",
            },
            limit: {
              type: "number",
              description: "Max rows (default: 25)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_top_pages",
        description:
          "Get top pages by page views. Shortcut for the most common report.",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date (default: '7daysAgo')",
            },
            end_date: {
              type: "string",
              description: "End date (default: 'today')",
            },
            path_contains: {
              type: "string",
              description:
                "Filter to pages containing this string (e.g., '/artists', '/railroadearth')",
            },
            limit: {
              type: "number",
              description: "Max pages to return (default: 25)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_top_events",
        description:
          "Get top events by count. See which user interactions happen most (play, pause, search, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date (default: '7daysAgo')",
            },
            end_date: {
              type: "string",
              description: "End date (default: 'today')",
            },
            event_name: {
              type: "string",
              description:
                "Filter to a specific event name (exact match). Omit for all events.",
            },
            limit: {
              type: "number",
              description: "Max events to return (default: 25)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_user_stats",
        description:
          "Get user/session overview: total users, new users, sessions, bounce rate, avg session duration, engagement rate.",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date (default: '30daysAgo')",
            },
            end_date: {
              type: "string",
              description: "End date (default: 'today')",
            },
            by_date: {
              type: "boolean",
              description:
                "Break down by date for trend analysis (default: false)",
            },
            by_device: {
              type: "boolean",
              description: "Break down by device category (default: false)",
            },
            by_source: {
              type: "boolean",
              description:
                "Break down by traffic source/medium (default: false)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_property_info",
        description:
          "Get GA4 property metadata: name, time zone, currency, data streams, and account info.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Helper: build a dimension filter
function buildDimensionFilter(filter: {
  dimension: string;
  match_type: string;
  value: string;
  negate?: boolean;
}) {
  return {
    filter: {
      fieldName: filter.dimension,
      stringFilter: {
        matchType: filter.match_type || "CONTAINS",
        value: filter.value,
      },
    },
  };
}

// Helper: format report response into a readable table
function formatReportResponse(response: any): string {
  if (!response || !response.rows || response.rows.length === 0) {
    return JSON.stringify(
      {
        row_count: 0,
        message: "No data found for the given parameters",
        metadata: response?.metadata || null,
      },
      null,
      2
    );
  }

  const dimensionHeaders =
    response.dimensionHeaders?.map((h: any) => h.name) || [];
  const metricHeaders =
    response.metricHeaders?.map((h: any) => h.name) || [];
  const headers = [...dimensionHeaders, ...metricHeaders];

  const rows = response.rows.map((row: any) => {
    const obj: Record<string, string | number> = {};
    row.dimensionValues?.forEach((v: any, i: number) => {
      obj[dimensionHeaders[i]] = v.value;
    });
    row.metricValues?.forEach((v: any, i: number) => {
      // Try to parse as number for cleaner output
      const num = parseFloat(v.value);
      obj[metricHeaders[i]] = isNaN(num) ? v.value : num;
    });
    return obj;
  });

  return JSON.stringify(
    {
      row_count: response.rowCount || rows.length,
      headers,
      rows,
    },
    null,
    2
  );
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "run_report": {
        const metrics = (args?.metrics as string[]) || ["screenPageViews"];
        const dimensions = (args?.dimensions as string[]) || [];
        const startDate = (args?.start_date as string) || "7daysAgo";
        const endDate = (args?.end_date as string) || "today";
        const limit = Math.min((args?.limit as number) || 25, 250);
        const orderBy = args?.order_by as string;
        const dimFilter = args?.dimension_filter as any;

        const reportRequest: any = {
          property: `properties/${PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          metrics: metrics.map((m) => ({ name: m })),
          limit,
        };

        if (dimensions.length > 0) {
          reportRequest.dimensions = dimensions.map((d) => ({ name: d }));
        }

        if (dimFilter) {
          reportRequest.dimensionFilter = buildDimensionFilter(dimFilter);
        }

        if (orderBy) {
          reportRequest.orderBys = [
            { metric: { metricName: orderBy }, desc: true },
          ];
        } else if (metrics.length > 0) {
          reportRequest.orderBys = [
            { metric: { metricName: metrics[0] }, desc: true },
          ];
        }

        const [response] = await dataClient.runReport(reportRequest);

        return {
          content: [{ type: "text", text: formatReportResponse(response) }],
        };
      }

      case "get_realtime": {
        const dimensions = (args?.dimensions as string[]) || [];
        const metrics = (args?.metrics as string[]) || ["activeUsers"];
        const limit = Math.min((args?.limit as number) || 25, 250);

        const realtimeRequest: any = {
          property: `properties/${PROPERTY_ID}`,
          metrics: metrics.map((m) => ({ name: m })),
          limit,
        };

        if (dimensions.length > 0) {
          realtimeRequest.dimensions = dimensions.map((d) => ({ name: d }));
        }

        const [response] = await dataClient.runRealtimeReport(realtimeRequest);

        return {
          content: [{ type: "text", text: formatReportResponse(response) }],
        };
      }

      case "get_top_pages": {
        const startDate = (args?.start_date as string) || "7daysAgo";
        const endDate = (args?.end_date as string) || "today";
        const pathContains = args?.path_contains as string;
        const limit = Math.min((args?.limit as number) || 25, 250);

        const reportRequest: any = {
          property: `properties/${PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [
            { metric: { metricName: "screenPageViews" }, desc: true },
          ],
          limit,
        };

        if (pathContains) {
          reportRequest.dimensionFilter = buildDimensionFilter({
            dimension: "pagePath",
            match_type: "CONTAINS",
            value: pathContains,
          });
        }

        const [response] = await dataClient.runReport(reportRequest);

        return {
          content: [{ type: "text", text: formatReportResponse(response) }],
        };
      }

      case "get_top_events": {
        const startDate = (args?.start_date as string) || "7daysAgo";
        const endDate = (args?.end_date as string) || "today";
        const eventName = args?.event_name as string;
        const limit = Math.min((args?.limit as number) || 25, 250);

        const reportRequest: any = {
          property: `properties/${PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "eventName" }],
          metrics: [
            { name: "eventCount" },
            { name: "totalUsers" },
          ],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit,
        };

        if (eventName) {
          reportRequest.dimensionFilter = buildDimensionFilter({
            dimension: "eventName",
            match_type: "EXACT",
            value: eventName,
          });
          // When filtering to one event, add date breakdown for trend
          reportRequest.dimensions.push({ name: "date" });
          reportRequest.orderBys = [
            { dimension: { dimensionName: "date" }, desc: true },
          ];
        }

        const [response] = await dataClient.runReport(reportRequest);

        return {
          content: [{ type: "text", text: formatReportResponse(response) }],
        };
      }

      case "get_user_stats": {
        const startDate = (args?.start_date as string) || "30daysAgo";
        const endDate = (args?.end_date as string) || "today";
        const byDate = args?.by_date as boolean;
        const byDevice = args?.by_device as boolean;
        const bySource = args?.by_source as boolean;

        const dimensions: { name: string }[] = [];
        if (byDate) dimensions.push({ name: "date" });
        if (byDevice) dimensions.push({ name: "deviceCategory" });
        if (bySource) {
          dimensions.push({ name: "sessionSource" });
          dimensions.push({ name: "sessionMedium" });
        }

        const reportRequest: any = {
          property: `properties/${PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "totalUsers" },
            { name: "newUsers" },
            { name: "sessions" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "engagementRate" },
            { name: "screenPageViewsPerSession" },
          ],
          limit: 100,
        };

        if (dimensions.length > 0) {
          reportRequest.dimensions = dimensions;
          if (byDate) {
            reportRequest.orderBys = [
              { dimension: { dimensionName: "date" }, desc: true },
            ];
          } else {
            reportRequest.orderBys = [
              { metric: { metricName: "totalUsers" }, desc: true },
            ];
          }
        }

        const [response] = await dataClient.runReport(reportRequest);

        return {
          content: [{ type: "text", text: formatReportResponse(response) }],
        };
      }

      case "get_property_info": {
        const propertyName = `properties/${PROPERTY_ID}`;

        const [property] = await adminClient.getProperty({
          name: propertyName,
        });

        // Get data streams
        const [streams] = await adminClient.listDataStreams({
          parent: propertyName,
        });

        const info = {
          property: {
            name: property.name,
            displayName: property.displayName,
            timeZone: property.timeZone,
            currencyCode: property.currencyCode,
            industryCategory: property.industryCategory,
            serviceLevel: property.serviceLevel,
            createTime: property.createTime,
            parent: property.parent,
          },
          data_streams: streams.map((s: any) => ({
            name: s.name,
            displayName: s.displayName,
            type: s.type,
            webStreamData: s.webStreamData || null,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
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
  console.error("GA4 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
