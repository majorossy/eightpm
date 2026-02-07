# dev-up vs prod-up Gap Analysis

**Date:** 2026-02-07
**Analyzer:** Analyzer Agent
**Purpose:** Identify improvements from prod-up to backport to dev-up

---

## Executive Summary

prod-up has significantly more robust verification, error handling, and reporting compared to dev-up. The key gaps are:

1. **Missing health check loop** (dev-up waits up to 60s but implementation unclear)
2. **No port verification** (dev-up doesn't verify 3001 responding)
3. **No GraphQL endpoint check** (dev-up doesn't test https://magento.test/graphql)
4. **No deploy mode check** (dev-up doesn't verify Magento in developer mode)
5. **No structured status reporting** (dev-up outputs URLs but no summary table)
6. **Less explicit verification logic** (prod-up has 7-step process, dev-up has 6 steps with less detail)

---

## 1. Features prod-up Has That dev-up Is Missing

### 1.1 Health Check Loop (Step 2)

**prod-up:**
```bash
# Run `bin/docker-compose --no-dev ps` in a loop (up to 60s) until all 6 core services show healthy
```

**dev-up:**
```bash
# Run `bin/docker-compose ps` in a loop (up to 60s) until all 8 services show healthy
```

**Gap:** dev-up mentions the loop but doesn't specify implementation details. prod-up is more explicit about the looping mechanism.

**Recommendation:** Add explicit loop implementation guidance:
```bash
# Poll `bin/docker-compose ps` every 2 seconds (max 30 iterations = 60s) until all 8 services report (healthy)
```

---

### 1.2 Port Verification (Step 7 in prod-up)

**prod-up:**
```bash
# Check port 3001 responding: `curl -s http://localhost:3001 -o /dev/null -w '%{http_code}'`
```

**dev-up:** Missing entirely.

**Gap:** dev-up doesn't verify the frontend server actually started and is accepting connections.

**Recommendation:** Add Step 6a (after Step 5 starts dev server):
```bash
6a. **Verify port 3001** — Poll `curl -s http://localhost:3001 -o /dev/null -w '%{http_code}'` until 200/304 (max 30s wait for HMR compilation)
```

---

### 1.3 GraphQL Endpoint Check (Step 7 in prod-up)

**prod-up:**
```bash
# GraphQL endpoint: `curl -sk https://magento.test/graphql`
```

**dev-up:** Missing entirely.

**Gap:** dev-up doesn't verify the Magento GraphQL API is responding.

**Recommendation:** Add Step 6b:
```bash
6b. **Verify GraphQL** — `curl -sk https://magento.test/graphql` (should return GraphQL introspection error, not 404/500)
```

---

### 1.4 Deploy Mode Check (Step 7 in prod-up)

**prod-up:**
```bash
# Magento deploy mode: `bin/magento deploy:mode:show`
```

**dev-up:** Missing entirely.

**Gap:** dev-up doesn't verify Magento is in developer mode (vs production mode).

**Recommendation:** Add Step 6c:
```bash
6c. **Verify deploy mode** — `bin/magento deploy:mode:show` (should output "developer")
```

---

### 1.5 Structured Status Reporting (Step 8 in prod-up)

**prod-up:**
```bash
# Output a summary table of all service statuses
```

**dev-up:**
```bash
# Check all services and output URLs
```

**Gap:** dev-up outputs URLs but no service status table. prod-up generates a visual summary.

**Recommendation:** Upgrade Step 6 to Step 7 with structured reporting:
```bash
7. **Report** — Output a summary table:
   | Service | Status | URL/Port |
   |---------|--------|----------|
   | Docker (8 services) | ✅ healthy | - |
   | Frontend (HMR dev) | ✅ running | http://localhost:3001 |
   | GraphQL API | ✅ responding | https://magento.test/graphql |
   | Admin Panel | ✅ available | https://magento.test/admin |
   | phpMyAdmin | ✅ running | http://localhost:8081 |
   | Mailcatcher | ✅ running | http://localhost:1080 |
   | Magento Mode | developer | - |
   | Cache Watcher | ✅ active | auto-flush enabled |
```

---

## 2. Verification Steps to Add to dev-up

| Step | Check | Command | Expected Result |
|------|-------|---------|-----------------|
| 2 (enhance) | Health check loop | Poll `bin/docker-compose ps` every 2s (max 30x) | All 8 services (healthy) |
| 6a (new) | Port 3001 responding | `curl -s http://localhost:3001 -o /dev/null -w '%{http_code}'` | 200 or 304 |
| 6b (new) | GraphQL endpoint | `curl -sk https://magento.test/graphql` | 400 (introspection error, not 404/500) |
| 6c (new) | Deploy mode | `bin/magento deploy:mode:show` | "developer" |
| 7 (upgrade) | Summary table | Format all checks into table | Visual status report |

---

## 3. Reporting Improvements from prod-up

### 3.1 Structured Output

**Current (dev-up):**
```
- Frontend: http://localhost:3001
- GraphQL: https://magento.test/graphql
- Admin: https://magento.test/admin
- phpMyAdmin: http://localhost:8081
- Mailcatcher: http://localhost:1080
```

**Improved (from prod-up):**
```
| Service | Status | URL/Port |
|---------|--------|----------|
| Docker containers | ✅ 8/8 healthy | - |
| Frontend (dev HMR) | ✅ running (PID 12345) | http://localhost:3001 |
| GraphQL API | ✅ responding | https://magento.test/graphql |
| Admin Panel | ✅ available | https://magento.test/admin |
| phpMyAdmin | ✅ dev-only | http://localhost:8081 |
| Mailcatcher | ✅ dev-only | http://localhost:1080 |
| Magento Mode | developer | bin/magento deploy:mode:show |
| Cache Watcher | ✅ active | auto-flush enabled |
```

### 3.2 Status Indicators

**Add:**
- ✅ for healthy/running
- ⏳ for starting/waiting
- ❌ for failed/unreachable
- ⚠️ for warnings (e.g., "HMR slow compile >30s")

---

## 4. Error Handling Patterns to Adopt

### 4.1 Timeout Handling

**prod-up pattern:**
```bash
# Poll every 2 seconds (max 30 iterations = 60s)
for i in {1..30}; do
  if bin/docker-compose --no-dev ps | grep -q 'healthy'; then
    break
  fi
  sleep 2
done
```

**Recommendation:** Add explicit timeout failure handling:
```bash
if [ $i -eq 30 ]; then
  echo "❌ Timeout: Containers not healthy after 60s"
  echo "Run 'bin/docker-compose logs' to debug"
  exit 1
fi
```

### 4.2 Port Conflict Detection

**prod-up pattern:**
```bash
# Verify port 3001 responding
HTTP_CODE=$(curl -s http://localhost:3001 -o /dev/null -w '%{http_code}')
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "304" ]; then
  echo "❌ Frontend not responding on port 3001 (got HTTP $HTTP_CODE)"
  exit 1
fi
```

**Recommendation:** Add to dev-up Step 6a with retry logic (HMR compile may take 10-15s).

### 4.3 GraphQL Validation

**prod-up pattern:**
```bash
# GraphQL should return 400 (introspection error) not 404/500
GRAPHQL_CODE=$(curl -sk https://magento.test/graphql -o /dev/null -w '%{http_code}')
if [ "$GRAPHQL_CODE" == "404" ] || [ "$GRAPHQL_CODE" == "500" ]; then
  echo "❌ GraphQL endpoint unreachable or erroring (HTTP $GRAPHQL_CODE)"
  exit 1
fi
```

**Recommendation:** Add to dev-up Step 6b.

---

## 5. Dev-Specific Features to PRESERVE in dev-up

**CRITICAL:** These features are unique to dev-up and MUST NOT be removed:

### 5.1 Dev-Only Services (8 containers vs 6)

**dev-up MUST check for:**
- phpMyAdmin on port 8081 (loaded from compose.dev.yaml)
- Mailcatcher on port 1080 (loaded from compose.dev.yaml)

**Total:** 8 services (6 core + 2 dev-only)

**prod-up checks:** 6 services (skips phpMyAdmin/mailcatcher)

---

### 5.2 HMR Dev Server (npm run dev)

**dev-up:**
```bash
5. Start dev server — `cd frontend && nohup npm run dev > /dev/null 2>&1 &`
```

**prod-up:**
```bash
5. Build frontend — `cd frontend && npm run build`
6. Start production server — `cd frontend && nohup npm start -- -p 3001 > /dev/null 2>&1 &`
```

**PRESERVE:** `npm run dev` enables Hot Module Replacement (HMR) for instant file changes. Production mode uses `npm run build` + `npm start`.

---

### 5.3 Cache Watcher Auto-Start

**dev-up:**
```bash
1. Start Docker containers — `bin/start` (auto-starts cache-clean watcher)
```

**PRESERVE:** Cache watcher is dev-only feature that auto-flushes Magento cache on file changes. Should be highlighted in dev-up reporting.

---

### 5.4 Developer Mode Verification

**dev-up should verify:**
```bash
bin/magento deploy:mode:show  # Should output "developer"
```

**prod-up verifies:** Same command but expects "production" or "default".

---

## 6. Recommended dev-up Updates

### Updated Agent File (Enhanced)

```yaml
---
name: dev-up
description: Start the 8PM project in development mode. Use when the user wants to start dev, boot dev, or bring up development services.
tools: Bash
model: sonnet
permissionMode: bypassPermissions
skills: [devops]
---

You are a DevOps agent for the 8PM live music archive. Start all services in development mode.

Execute these steps sequentially:

1. **Start Docker containers** — `bin/start` (no flags = dev mode; loads all 3 compose files including compose.dev.yaml for phpMyAdmin on 8081; auto-starts cache-clean watcher; handles RAM check)

2. **Verify container health** — Poll `bin/docker-compose ps` every 2 seconds (max 30 iterations = 60s) until all 8 services show (healthy): app, phpfpm, db, redis, opensearch, rabbitmq, phpmyadmin, mailcatcher. If timeout, output logs and exit.

3. **Kill stale frontend** — `lsof -ti:3001 | xargs kill -9 2>/dev/null || true`

4. **Install frontend deps** — `cd frontend && npm install`

5. **Start dev server** — `cd frontend && nohup npm run dev > /dev/null 2>&1 &` (HMR enabled, port 3001 hardcoded in package.json)

6. **Verify services** — Check:
   - Port 3001 responding: Poll `curl -s http://localhost:3001 -o /dev/null -w '%{http_code}'` until 200/304 (max 30s for HMR compile)
   - GraphQL endpoint: `curl -sk https://magento.test/graphql` (should return 400, not 404/500)
   - Deploy mode: `bin/magento deploy:mode:show` (should output "developer")

7. **Report** — Output a summary table of all service statuses:
   | Service | Status | URL/Port |
   |---------|--------|----------|
   | Docker containers | ✅ 8/8 healthy | - |
   | Frontend (dev HMR) | ✅ running | http://localhost:3001 |
   | GraphQL API | ✅ responding | https://magento.test/graphql |
   | Admin Panel | ✅ available | https://magento.test/admin |
   | phpMyAdmin | ✅ dev-only | http://localhost:8081 |
   | Mailcatcher | ✅ dev-only | http://localhost:1080 |
   | Magento Mode | developer | - |
   | Cache Watcher | ✅ active | auto-flush enabled |

Design: Idempotent. `bin/start` handles RAM validation, volume checks, and cache watcher automatically. Never push to git.
```

---

## 7. Summary of Changes

| Category | Changes |
|----------|---------|
| **Verification** | +4 new checks (port 3001, GraphQL, deploy mode, health loop details) |
| **Error Handling** | +3 timeout/failure patterns (container health, port verify, GraphQL verify) |
| **Reporting** | Upgrade from URL list to structured status table with ✅/❌ indicators |
| **Preserved** | 8 services (not 6), `npm run dev` (not build+start), cache watcher highlight |

---

## 8. Implementation Priority

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| **P0** | Add health check loop timeout handling | Low | High (prevents silent failures) |
| **P0** | Add port 3001 verification | Low | High (catches frontend startup failures) |
| **P1** | Add GraphQL endpoint check | Low | Medium (catches Magento config issues) |
| **P1** | Upgrade to structured status table | Medium | High (better UX, matches prod-up) |
| **P2** | Add deploy mode verification | Low | Low (nice-to-have, rarely fails) |

---

## 9. Testing Plan

After updating dev-up:

1. **Normal startup test:**
   ```bash
   bin/stop
   # Invoke dev-up agent
   # Verify all 8 services healthy, port 3001 responding, table output
   ```

2. **Failure scenarios:**
   - Docker not running (should fail at Step 1 with clear error)
   - Port 3001 occupied (should fail at Step 3 kill, or Step 5 startup)
   - Container unhealthy after 60s (should timeout at Step 2 with log guidance)
   - GraphQL misconfigured (should fail at Step 6 with HTTP code)

3. **Idempotency test:**
   ```bash
   # Invoke dev-up twice
   # Second run should gracefully handle already-running services
   ```

---

## 10. Conclusion

dev-up is functional but lacks the robust verification and reporting present in prod-up. By adopting the 7 improvements above, dev-up will:

- ✅ Catch failures earlier (port conflicts, unhealthy containers, GraphQL errors)
- ✅ Provide clearer status reporting (table format with visual indicators)
- ✅ Match prod-up's reliability while preserving dev-specific features
- ✅ Improve developer experience with actionable error messages

**Estimated effort:** 30-45 minutes to implement all P0/P1 changes.

**Risk:** Low (all changes are additive, no existing functionality removed).
