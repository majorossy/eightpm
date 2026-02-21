Check 8PM production health — services, endpoints, data, and indexes.

## Instructions

**You MUST use TaskCreate to create all 3 tasks up front before starting any work.** Then use TaskUpdate to mark each task `in_progress` before starting it and `completed` when done. This gives the user a visual checklist of progress.

### Tasks to create:

1. **subject:** "Check services & endpoints"
   **activeForm:** "Checking services and endpoints"
   **description:** "Check Docker containers, PM2 frontend process, and production URLs (https://8pm.me, https://magento.8pm.me/graphql)"

2. **subject:** "Check data health"
   **activeForm:** "Checking data health"
   **description:** "Run bin/check-status --no-gql and report per-artist health"

3. **subject:** "Fix stale indexes (if needed)"
   **activeForm:** "Fixing stale indexes"
   **description:** "Run bin/fix-index if any IDX_STALE issues found, then verify with bin/check-status --no-gql"

---

### Execution:

**Task 1 — Services & endpoints:**
- Set task to `in_progress`
- Run all checks in parallel:
  - **Docker:** `bin/docker-compose ps` (or `bin/docker-compose --no-dev ps`)
  - **PM2 frontend:** `pm2 list`
  - **Frontend URL:** `curl -sk -o /dev/null -w "%{http_code}" https://8pm.me`
  - **GraphQL health:** `curl -sk -X POST https://magento.8pm.me/graphql -H 'Content-Type: application/json' -d '{"query":"{ storeConfig { store_name } }"}'`
  - **Indexer status:** `bin/magento indexer:status`
  - **Redis:** Use MCP `redis-8pm` → `dbsize` + `info` (section "memory")
  - **DB connectivity:** Use MCP `mysql-8pm` → `SELECT COUNT(*) as products FROM catalog_product_entity`
  - **Container resources:** Use MCP `docker-8pm` → `container_stats`
- Output a clean status table. Flag anything unexpected (container down, PM2 not online, HTTP ≠ 200, GraphQL error, indexer invalid/suspended).
- Mark task `completed`

**Task 2 — Data health:**
- Set task to `in_progress`
- Run: `bin/check-status --no-gql`
- Report the output as-is (it has good formatting)
- Mark task `completed`
- If ALL artists show `OK`, mark task 3 `completed` (skipped) and stop — tell the user everything is healthy

**Task 3 — Fix stale indexes (if needed):**
- If task 2 found `IDX_STALE` statuses (CCP ≠ IDX mismatch):
  - Set task to `in_progress`
  - Run: `bin/fix-index`
  - Run: `bin/check-status --no-gql` to verify the fix
  - Report before/after IDX counts
  - Mark task `completed`
- If no `IDX_STALE` issues: mark task `completed` (skipped)

Do NOT run any commands beyond what is listed above. If there are `POPULATE` errors (recordings exist but 0 products), tell the user which artists need populating and suggest the commands, but do not run them automatically.
