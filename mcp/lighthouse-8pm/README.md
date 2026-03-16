# Lighthouse MCP Server (lighthouse-8pm)

MCP server for running Google Lighthouse audits directly from Claude Code. No API key, no setup — just works.

## Setup

None. It uses your local Chrome installation. Ready to go after restarting Claude Code.

The default URL is `http://localhost:3001` (the 8PM frontend). Override per-call or set `LIGHTHOUSE_DEFAULT_URL` env var in `.mcp.json`.

## Available Tools

| Tool | Description |
|------|-------------|
| `run_audit` | Full audit — scores for all categories + top issues |
| `get_performance_metrics` | Core Web Vitals: LCP, CLS, TBT, FCP, SI, TTI, TTFB |
| `get_accessibility_issues` | Accessibility failures with element selectors |
| `get_seo_issues` | SEO failures: meta tags, crawlability, structured data |
| `get_diagnostics` | Performance opportunities: unused JS/CSS, render-blocking, images, cache |
| `compare_devices` | Run mobile + desktop side by side and compare scores |

## Example Queries (via Claude Code)

- "Run a Lighthouse audit on the homepage"
- "What are the Core Web Vitals for the artist page?"
- "Check accessibility issues on localhost:3001/artists/railroadearth"
- "Compare mobile vs desktop performance"
- "What SEO issues does the homepage have?"
- "Show me performance diagnostics for the album page"

## Notes

- Each audit launches a headless Chrome instance, runs ~10-30 seconds
- Mobile is the default device (matches Google's mobile-first indexing)
- `compare_devices` runs two audits sequentially (~30-60 seconds total)
- Lighthouse scores can vary between runs (network, CPU load) — run multiple times for reliable numbers

## Rebuilding

If you modify `src/index.ts`:

```bash
cd mcp/lighthouse-8pm
npm install
npx esbuild src/index.ts --bundle --platform=node --target=node18 --format=cjs --outfile=bundle.cjs
```
