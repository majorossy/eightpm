# GA4 MCP Server (ga4-8pm)

MCP server for querying Google Analytics 4 data directly from Claude Code.

## Setup

All code is written and bundled. You just need to create a Google service account and plug in two values.

### Step 1: Enable the APIs

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Go to **APIs & Services > Library**
4. Search for and enable:
   - **Google Analytics Data API**
   - **Google Analytics Admin API**

### Step 2: Create a Service Account

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Name it something like `8pm-analytics`
4. Skip the optional permissions steps, click **Done**
5. Click into the new service account
6. Go to the **Keys** tab
7. Click **Add Key > Create new key > JSON**
8. Save the downloaded file somewhere safe (e.g. `~/.config/gcloud/8pm-ga4-credentials.json`)

### Step 3: Grant GA4 Access

1. Go to https://analytics.google.com
2. Navigate to **Admin > Property Access Management**
3. Click the **+** button > **Add users**
4. Paste the service account email (looks like `8pm-analytics@your-project.iam.gserviceaccount.com`)
5. Set role to **Viewer**
6. Click **Add**

### Step 4: Get Your Property ID

1. In GA4, go to **Admin > Property Settings**
2. Copy the **Property ID** (numeric, e.g. `123456789`)

### Step 5: Configure .mcp.json

Edit `.mcp.json` in the project root and fill in the two values:

```json
"ga4-8pm": {
  "type": "stdio",
  "command": "node",
  "args": ["mcp/ga4-8pm/bundle.cjs"],
  "env": {
    "GA4_PROPERTY_ID": "YOUR_PROPERTY_ID_HERE",
    "GA4_CREDENTIALS_PATH": "/absolute/path/to/your-credentials.json"
  }
}
```

### Step 6: Restart Claude Code

The new MCP server will be available on next session.

## Available Tools

| Tool | Description |
|------|-------------|
| `run_report` | Custom report with any dimensions/metrics, filters, date ranges |
| `get_realtime` | Active users right now (last 30 min) |
| `get_top_pages` | Most viewed pages with optional path filter |
| `get_top_events` | Most fired events (play, search, etc.) |
| `get_user_stats` | Users, sessions, bounce rate, engagement — with breakdowns |
| `get_property_info` | GA4 property metadata and data streams |

## Example Queries (via Claude Code)

Once configured, just ask naturally:

- "What are the top pages this week?"
- "Show me real-time users"
- "How many users visited artist pages in the last 30 days?"
- "What events fire most on the site?"
- "Break down users by device type this month"
- "What's the bounce rate trend over the last 2 weeks?"

## Rate Limits (Free)

| API | Daily Limit |
|-----|-------------|
| Core reports | 10,000/day |
| Real-time reports | 10/day |
| Admin API | 600/min |

## Rebuilding

If you modify `src/index.ts`:

```bash
cd mcp/ga4-8pm
npm install        # first time only
npx esbuild src/index.ts --bundle --platform=node --target=node18 --format=cjs --outfile=bundle.cjs
```
