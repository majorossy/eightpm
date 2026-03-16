#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Lighthouse and chrome-launcher are ESM-only in v13, dynamic import needed for CJS bundle
let lighthouse: any;
let chromeLauncher: any;

async function loadDeps() {
  if (!lighthouse) {
    lighthouse = (await import("lighthouse")).default;
    chromeLauncher = await import("chrome-launcher");
  }
}

// Default URL for local dev
const DEFAULT_URL = process.env.LIGHTHOUSE_DEFAULT_URL || "http://localhost:3001";

const server = new Server(
  {
    name: "lighthouse-8pm",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Shared runner — launches Chrome, runs Lighthouse, kills Chrome
async function runLighthouse(
  url: string,
  options: {
    categories?: string[];
    device?: "mobile" | "desktop";
    onlyAudits?: string[];
  } = {}
) {
  await loadDeps();

  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--ignore-certificate-errors",
    ],
  });

  try {
    const flags: any = {
      port: chrome.port,
      output: "json",
      logLevel: "error",
    };

    const config: any = {
      extends: "lighthouse:default",
      settings: {},
    };

    // Device emulation
    if (options.device === "desktop") {
      config.settings.formFactor = "desktop";
      config.settings.screenEmulation = {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      };
      config.settings.throttling = {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      };
      config.settings.emulatedUserAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    }

    // Category selection
    if (options.categories && options.categories.length > 0) {
      config.settings.onlyCategories = options.categories;
    }

    // Specific audit selection
    if (options.onlyAudits && options.onlyAudits.length > 0) {
      config.settings.onlyAudits = options.onlyAudits;
    }

    const result = await lighthouse(url, flags, config);
    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

// Extract category scores from LHR
function extractScores(lhr: any): Record<string, number | null> {
  const scores: Record<string, number | null> = {};
  for (const [key, cat] of Object.entries(lhr.categories || {})) {
    scores[key] = (cat as any).score !== null ? Math.round((cat as any).score * 100) : null;
  }
  return scores;
}

// Extract failing audits from a category
function extractIssues(lhr: any, categoryId: string): any[] {
  const category = lhr.categories?.[categoryId];
  if (!category) return [];

  return category.auditRefs
    .map((ref: any) => {
      const audit = lhr.audits[ref.id];
      if (!audit || audit.score === null || audit.score === 1) return null;

      const issue: any = {
        id: audit.id,
        title: audit.title,
        score: Math.round(audit.score * 100),
        description: audit.description,
      };

      // Include display value (e.g., "2.5 s" for LCP)
      if (audit.displayValue) {
        issue.displayValue = audit.displayValue;
      }

      // Include failing elements for accessibility
      if (audit.details?.items?.length > 0) {
        issue.items = audit.details.items.slice(0, 5).map((item: any) => {
          const entry: any = {};
          if (item.node?.snippet) entry.snippet = item.node.snippet;
          if (item.node?.selector) entry.selector = item.node.selector;
          if (item.node?.explanation) entry.explanation = item.node.explanation;
          if (item.url) entry.url = item.url;
          if (item.wastedMs) entry.wastedMs = Math.round(item.wastedMs);
          if (item.wastedBytes) entry.wastedKB = Math.round(item.wastedBytes / 1024);
          if (item.totalBytes) entry.totalKB = Math.round(item.totalBytes / 1024);
          if (item.statistic) entry.statistic = item.statistic;
          if (item.value) entry.value = item.value;
          return entry;
        });
      }

      return issue;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.score - b.score);
}

// Extract Core Web Vitals from audits
function extractCoreWebVitals(lhr: any) {
  const metrics = [
    { id: "first-contentful-paint", label: "FCP", unit: "s" },
    { id: "largest-contentful-paint", label: "LCP", unit: "s" },
    { id: "total-blocking-time", label: "TBT", unit: "ms" },
    { id: "cumulative-layout-shift", label: "CLS", unit: "" },
    { id: "speed-index", label: "SI", unit: "s" },
    { id: "interactive", label: "TTI", unit: "s" },
    { id: "max-potential-fid", label: "Max FID", unit: "ms" },
    { id: "server-response-time", label: "TTFB", unit: "ms" },
  ];

  return metrics
    .map((m) => {
      const audit = lhr.audits[m.id];
      if (!audit) return null;
      return {
        metric: m.label,
        value: audit.displayValue || audit.numericValue,
        numericValue: audit.numericValue,
        score: audit.score !== null ? Math.round(audit.score * 100) : null,
        rating: audit.score === null ? "n/a" : audit.score >= 0.9 ? "good" : audit.score >= 0.5 ? "needs-work" : "poor",
      };
    })
    .filter(Boolean);
}

// Extract performance diagnostics (opportunities + diagnostics)
function extractDiagnostics(lhr: any) {
  const dominated = [
    "render-blocking-resources",
    "unused-javascript",
    "unused-css-rules",
    "modern-image-formats",
    "uses-optimized-images",
    "uses-responsive-images",
    "offscreen-images",
    "unminified-css",
    "unminified-javascript",
    "uses-text-compression",
    "uses-long-cache-ttl",
    "dom-size",
    "critical-request-chains",
    "redirects",
    "uses-rel-preconnect",
    "efficient-animated-content",
    "duplicated-javascript",
    "legacy-javascript",
    "total-byte-weight",
    "mainthread-work-breakdown",
    "bootup-time",
    "font-display",
    "third-party-summary",
    "largest-contentful-paint-element",
    "layout-shift-elements",
    "long-tasks",
  ];

  return dominated
    .map((id) => {
      const audit = lhr.audits[id];
      if (!audit || audit.score === null || audit.score === 1) return null;

      const entry: any = {
        id: audit.id,
        title: audit.title,
        score: Math.round(audit.score * 100),
      };

      if (audit.displayValue) entry.displayValue = audit.displayValue;

      // Summarize top items
      if (audit.details?.items?.length > 0) {
        entry.items = audit.details.items.slice(0, 3).map((item: any) => {
          const e: any = {};
          if (item.url) e.url = item.url.substring(0, 120);
          if (item.wastedMs) e.wastedMs = Math.round(item.wastedMs);
          if (item.wastedBytes) e.wastedKB = Math.round(item.wastedBytes / 1024);
          if (item.totalBytes) e.totalKB = Math.round(item.totalBytes / 1024);
          if (item.statistic) e.statistic = item.statistic;
          if (item.groupLabel) e.group = item.groupLabel;
          return e;
        });
      }

      return entry;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.score - b.score);
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_audit",
        description: `Run a full Lighthouse audit. Returns scores for all categories plus top issues. Default URL: ${DEFAULT_URL}`,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
            device: {
              type: "string",
              enum: ["mobile", "desktop"],
              description: "Device emulation (default: mobile)",
            },
            categories: {
              type: "array",
              items: { type: "string" },
              description:
                "Categories to audit: 'performance', 'accessibility', 'best-practices', 'seo'. Default: all",
            },
          },
          required: [],
        },
      },
      {
        name: "get_performance_metrics",
        description:
          "Get Core Web Vitals and performance timing: LCP, CLS, TBT, FCP, SI, TTI, TTFB.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
            device: {
              type: "string",
              enum: ["mobile", "desktop"],
              description: "Device emulation (default: mobile)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_accessibility_issues",
        description:
          "Get accessibility failures with element selectors and fix suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
          },
          required: [],
        },
      },
      {
        name: "get_seo_issues",
        description:
          "Get SEO audit failures: meta tags, crawlability, structured data, mobile friendliness.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
          },
          required: [],
        },
      },
      {
        name: "get_diagnostics",
        description:
          "Get performance diagnostics: render-blocking resources, unused JS/CSS, image optimization, cache policy, DOM size, etc.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
            device: {
              type: "string",
              enum: ["mobile", "desktop"],
              description: "Device emulation (default: mobile)",
            },
          },
          required: [],
        },
      },
      {
        name: "compare_devices",
        description:
          "Run Lighthouse on both mobile and desktop and compare the scores side by side.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: `URL to audit (default: ${DEFAULT_URL})`,
            },
          },
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
      case "run_audit": {
        const url = (args?.url as string) || DEFAULT_URL;
        const device = (args?.device as "mobile" | "desktop") || "mobile";
        const categories = args?.categories as string[] | undefined;

        const lhr = await runLighthouse(url, { categories, device });
        const scores = extractScores(lhr);

        // Collect top issues per category (max 5 each)
        const issuesByCategory: Record<string, any[]> = {};
        for (const catId of Object.keys(lhr.categories || {})) {
          const issues = extractIssues(lhr, catId);
          if (issues.length > 0) {
            issuesByCategory[catId] = issues.slice(0, 5);
          }
        }

        const result = {
          url: lhr.finalDisplayedUrl || url,
          device,
          fetchTime: lhr.fetchTime,
          scores,
          issues: issuesByCategory,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_performance_metrics": {
        const url = (args?.url as string) || DEFAULT_URL;
        const device = (args?.device as "mobile" | "desktop") || "mobile";

        const lhr = await runLighthouse(url, {
          categories: ["performance"],
          device,
        });

        const result = {
          url: lhr.finalDisplayedUrl || url,
          device,
          score: extractScores(lhr).performance,
          metrics: extractCoreWebVitals(lhr),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_accessibility_issues": {
        const url = (args?.url as string) || DEFAULT_URL;

        const lhr = await runLighthouse(url, {
          categories: ["accessibility"],
          device: "desktop",
        });

        const issues = extractIssues(lhr, "accessibility");

        const result = {
          url: lhr.finalDisplayedUrl || url,
          score: extractScores(lhr).accessibility,
          issue_count: issues.length,
          issues,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_seo_issues": {
        const url = (args?.url as string) || DEFAULT_URL;

        const lhr = await runLighthouse(url, {
          categories: ["seo"],
          device: "mobile",
        });

        const issues = extractIssues(lhr, "seo");

        const result = {
          url: lhr.finalDisplayedUrl || url,
          score: extractScores(lhr).seo,
          issue_count: issues.length,
          issues,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_diagnostics": {
        const url = (args?.url as string) || DEFAULT_URL;
        const device = (args?.device as "mobile" | "desktop") || "mobile";

        const lhr = await runLighthouse(url, {
          categories: ["performance"],
          device,
        });

        const diagnostics = extractDiagnostics(lhr);

        const result = {
          url: lhr.finalDisplayedUrl || url,
          device,
          performance_score: extractScores(lhr).performance,
          diagnostic_count: diagnostics.length,
          diagnostics,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "compare_devices": {
        const url = (args?.url as string) || DEFAULT_URL;

        // Run sequentially (each launches its own Chrome)
        const mobileLhr = await runLighthouse(url, {
          device: "mobile",
        });
        const desktopLhr = await runLighthouse(url, {
          device: "desktop",
        });

        const mobileScores = extractScores(mobileLhr);
        const desktopScores = extractScores(desktopLhr);

        // Build comparison
        const comparison: Record<string, { mobile: number | null; desktop: number | null; diff: number | null }> = {};
        for (const key of new Set([...Object.keys(mobileScores), ...Object.keys(desktopScores)])) {
          const m = mobileScores[key] ?? null;
          const d = desktopScores[key] ?? null;
          comparison[key] = {
            mobile: m,
            desktop: d,
            diff: m !== null && d !== null ? d - m : null,
          };
        }

        const mobileMetrics = extractCoreWebVitals(mobileLhr);
        const desktopMetrics = extractCoreWebVitals(desktopLhr);

        const metricsComparison = mobileMetrics.map((m: any) => {
          const d = desktopMetrics.find((dm: any) => dm.metric === m.metric);
          return {
            metric: m.metric,
            mobile: m.value,
            desktop: d?.value ?? "n/a",
            mobileRating: m.rating,
            desktopRating: d?.rating ?? "n/a",
          };
        });

        const result = {
          url: mobileLhr.finalDisplayedUrl || url,
          scores: comparison,
          metrics: metricsComparison,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
  console.error("Lighthouse 8pm MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
