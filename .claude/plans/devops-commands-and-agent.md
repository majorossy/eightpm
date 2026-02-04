# Plan: DevOps Slash Commands + Enhanced DevOps Skill

## Overview

Create 3 executable slash commands in `.claude/commands/` and enhance the existing DevOps skill to cover full ops + deploy.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.claude/commands/prod-up.md` | **Create** | `/prod-up` - Production startup |
| `.claude/commands/dev-up.md` | **Create** | `/dev-up` - Development startup |
| `.claude/commands/status.md` | **Create** | `/status` - Health check |
| `.claude/skills/devops.md` | **Update** | Add operational runbooks |

---

## 1. `/prod-up` Command

**File:** `/var/www/eightpm/.claude/commands/prod-up.md`

Steps the command instructs Claude to execute:

1. **Start Docker** - `bin/start --no-dev` (skips phpMyAdmin, skips cache-clean watcher)
2. **Verify health** - `bin/docker-compose --no-dev ps`, wait up to 60s for all 6 services healthy
3. **Kill stale frontend** - `lsof -ti:3001 | xargs kill -9` if anything on port 3001
4. **Build frontend** - `cd frontend && npm run build` (SSG, ~340 pages)
5. **Start production server** - `cd frontend && npm start -- -p 3001` (background via nohup)
6. **Verify** - Check containers, port 3001, GraphQL endpoint, frontend HTTP, Magento mode
7. **Report** - Summary table of all service statuses

Key design: Idempotent (safe to re-run), kills existing frontend before rebuild, uses `--no-dev` throughout.

---

## 2. `/dev-up` Command

**File:** `/var/www/eightpm/.claude/commands/dev-up.md`

Steps:

1. **Start Docker** - `bin/docker-compose up -d --remove-orphans` (NOT `bin/start` which blocks on cache-clean watcher). Loads all 3 compose files including dev (phpMyAdmin on 8081).
2. **Verify health** - Wait for all 8 services (includes phpMyAdmin + mailcatcher)
3. **Start cache watcher** - `bin/cache-clean --watch` in background
4. **Kill stale frontend** - Kill anything on port 3001
5. **Start dev server** - `cd frontend && npm run dev` (background via nohup, HMR enabled, port 3001)
6. **Verify + Report** - Include phpMyAdmin (8081) and Mailcatcher (1080) URLs

Note: `npm run rebuild` is referenced in global CLAUDE.md but no `rebuild` script exists in root `package.json`. The command will skip this unless the user adds the script.

---

## 3. `/status` Command

**File:** `/var/www/eightpm/.claude/commands/status.md`

Checks to run (all non-destructive, read-only):

1. **Docker containers** - `bin/docker-compose ps` (try with dev files, fallback to --no-dev)
2. **Frontend process** - `lsof -ti:3001` + detect dev vs production mode from process args
3. **Magento mode** - `bin/magento deploy:mode:show`
4. **GraphQL health** - curl storeConfig query to `https://magento.test/graphql`
5. **Port scan** - Check all project ports (3001, 3307, 6380, 9201, 15673, 8081, 1080)
6. **Indexer status** - `bin/magento indexer:status`
7. **Docker resources** - `docker system df`

Output: Clean summary table with status indicators and recommendations for any issues found.

---

## 4. Enhanced DevOps Skill

**File:** `/var/www/eightpm/.claude/skills/devops.md` (append new sections)

New sections to add at end of file:

- **Cache Management Deep Dive** - Cache types table, clean vs flush, OPcache, Redis, frontend cache
- **Index Management Deep Dive** - Known store1 bug, fix-index requirement, troubleshooting decision tree
- **Production Deploy Pipeline** - Full 8-step sequence (maintenance mode, composer, upgrade, compile, static, cache, reindex, unmaintain)
- **After-Pull Workflow** - Manual steps if `bin/rs after-pull` fails
- **Permission Management** - Common symptoms and fixes
- **Log Management** - Magento logs, Docker logs, frontend logs with paths
- **Troubleshooting Decision Trees** - Site not loading, GraphQL errors, container failures, slow performance
- **Environment Switching** - Dev <-> Prod mode switching procedures
- **Backup & Restore** - Database, metadata (git LFS)
- **Cron Management** - Enable/disable, manual trigger, schedule queries
- **Docker Resource Management** - Stats, disk usage, safe pruning

---

## Verification

After implementation, test each command:

1. `/prod-up` - Run the command, verify all services come up and frontend serves on 3001
2. `/dev-up` - Stop everything first (`bin/stop`), run command, verify phpMyAdmin on 8081, HMR working
3. `/status` - Run with services up, verify accurate reporting. Run with services down, verify it handles missing services gracefully
4. DevOps skill - Ask Claude operational questions and verify it references the new runbook content
