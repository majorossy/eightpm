# Magento 2 Headless Docker Development Environment

## ⚠️ CRITICAL: Metadata Protection Rule

**NEVER delete downloaded metadata - it's tracked in git with LFS**

| Location | Purpose |
|----------|---------|
| `data/archivedotorg-metadata/` | Git-tracked (with LFS) |
| `/var/www/html/var/archivedotorg/metadata/` | Docker container copy |

**Size:** ~1.1GB (36 artists, thousands of JSON files)
**Downloaded over:** Many hours of Archive.org API calls

### Prohibited Actions
- Running `archive:cleanup:cache` (command is disabled)
- Deleting `*.json` files from metadata directories
- Running `rm` commands on metadata folders
- Clearing the Docker volume without backing up

### Managing Metadata
```bash
# After downloading new metadata
bin/sync-metadata export          # Docker → Host (for git commit)
git add data/archivedotorg-metadata/
git commit -m "Update metadata"

# After git pull with new metadata
bin/sync-metadata import          # Host → Docker

# Check sync status
bin/sync-metadata status
```

### Re-importing (Updates in Place)
```bash
bin/magento archive:download "Artist Name"  # Updates existing files
bin/sync-metadata export                     # Export to git
```

---

## Import Status - IN PROGRESS (2026-01-30)

**Status:** 🔄 17/35 artists downloaded, populating tracks
**Tracking:** `docs/IMPORT_STATUS.md` - **READ THIS TO RESUME**

**Downloaded (ready for populate):**
- moe (1,803), Grateful Dead (1,861), Keller Williams (955), Leftover Salmon (883)
- Guster (759), Cabinet (615), Of a Revolution (541), Phil Lesh (487)
- Lettuce (417), My Morning Jacket (414), God Street Wine (371)
- Grace Potter (362), Matisyahu (344), Billy Strings (326)
- Goose (286), Furthur (248), Dogs in a Pile (135)

**Still need downloading:** Phish, STS9, Widespread Panic, String Cheese, Disco Biscuits, Railroad Earth, Tedeschi Trucks, Yonder Mountain, Twiddle, Ween, Ratdog, Rusted Root, Tea Leaf Green, Warren Zevon, King Gizzard, John Mayer, Smashing Pumpkins, Mac Creek

**Resume commands:**
```bash
# Start Docker and containers
open -a Docker && sleep 10 && bin/start

# Populate downloaded artists (with --force to re-import)
bin/magento archive:populate "Artist Name" --force

# Download remaining artists
bin/magento archive:download "Phish"
bin/magento archive:populate "Phish"
```

See `docs/IMPORT_STATUS.md` for full resume instructions.

---

## GraphQL Schema Expansion - COMPLETE (2026-02-07)

**Status:** ✅ All 38 Archive.org product attributes now exposed in GraphQL
**Location:** `docs/GRAPHQL_SCHEMA_EXPANSION.md`

**What Changed:**
Previously only 16 Archive.org attributes were accessible via GraphQL. Added 22 missing fields including:
- ✅ `show_location` - City/state (e.g., "Morrison, CO") - **solves venue location display**
- ✅ `show_venue`, `show_date`, `show_year` - Complete show metadata
- ✅ `show_taper`, `show_transferer`, `lineage`, `notes` - Recording source details
- ✅ `identifier`, `guid` - Archive.org identifiers
- ✅ `archive_avg_rating`, `archive_num_reviews`, `archive_downloads*` - Statistics
- ✅ `title`, `length` - Track details
- ✅ `dir`, `server_one`, `server_two` - Server/storage paths

**Impact:**
- Frontend can now display venue + city/state on recording cards
- All recording metadata (taper, lineage, notes) accessible
- Download counts and ratings available for sorting/filtering
- Complete show context for SEO and structured data

**Test Query:**
```graphql
query {
  products(filter: {archive_collection: {eq: "Railroad Earth"}}, pageSize: 1) {
    items {
      show_venue
      show_location  # NEW: "Morrison, CO"
      show_date
      lineage
      notes
      archive_downloads
    }
  }
}
```

**Cache Cleared:** Magento cache flushed after schema update

---

## SEO Keyword Research - COMPLETE (2026-01-29)

**Status:** ✅ Research phase complete, ready for CARD-1 and CARD-2 implementation
**Location:** `docs/seo-implementation/`

**Created Documents (5,853 words total):**
- `KEYWORD_RESEARCH.md` (1,945 words) - Master keyword strategy with title/description templates
- `KEYWORD_RESEARCH_README.md` (1,539 words) - Navigation guide and implementation roadmap
- `keywords/phish.md` (1,642 words) - Deep-dive Phish keyword research
- `keywords/_TEMPLATE.md` (727 words) - Template for expanding to 35+ other artists

**What's Ready:**
- ✅ Title templates for artist/show/track pages
- ✅ Meta description templates using rich data (band_total_shows, show_venue, etc.)
- ✅ Competitor analysis (Archive.org, LivePhish.com, Phish.in)
- ✅ Phish-specific keywords (high-volume to ultra long-tail)
- ✅ Famous shows to prioritize (Baker's Dozen, Big Cypress, etc.)
- ✅ Expandable structure for Grateful Dead, STS9, and 33 other artists

**Key Insights:**
- Users search "{artist} {venue} {date}" (ultra long-tail, high intent)
- "Soundboard" is a major quality signal (3x volume vs "audience")
- "Free streaming, no signup" is competitive advantage vs LivePhish
- Archive.org titles too long (90+ chars), we can outrank with cleaner titles

**Next Steps:**
1. Reference `KEYWORD_RESEARCH.md` when implementing CARD-1 (backend meta fields)
2. Reference `keywords/phish.md` when implementing CARD-2 (frontend metadata)
3. Test with Phish data first, then expand to other artists

**Quick Reference:**
- Artist page title: `{Artist} Live Recordings & Concert Downloads | 8PM Archive`
- Show page title: `{Artist} Live at {Venue} ({Date}) - Soundboard Recording | 8PM`
- Keep titles under 60 characters, descriptions under 160 characters

---

## Soundboard Badge & Recording Source Display - COMPLETE (2026-01-29)

**Status:** ✅ Implementation complete | ⏳ Testing pending (needs soundboard recordings)
**Location:** `docs/SOUNDBOARD_BADGE_TESTING.md`

**Implemented:**
- Gold "SBD" badge on soundboard recording cards (album page carousel)
- Recording source (lineage) displayed below quality button in all 3 player locations
- Detection utilities for soundboard/matrix/audience classification
- Intelligent text truncation (35/50/60 chars depending on location)

**Testing Challenge:**
- STS9 has 7,946 tracks but **0 soundboard recordings** (all audience)
- Use **String Cheese Incident** or **moe.** for testing (confirmed soundboards)
- See `docs/SOUNDBOARD_BADGE_TESTING.md` for full test plan and verification checklist

**Test URLs:**
- String Cheese: http://localhost:3001/thestringcheeseincident/roundthewheel52539 (20 SBD tracks)
- moe.: http://localhost:3001/artists/moe (multiple SBD tracks)

---

## Catalog Category Product Indexer Fix - COMPLETE (2026-01-30)

**Status:** ✅ Fixed - GraphQL queries now return correct product counts

### Problem

GraphQL queries returned 0 products for artist categories (e.g., Keller Williams) even though products existed in the database. The native `catalog_category_product` indexer reported success but wasn't populating the correct tables.

### Root Cause

**Magento 2.4+ uses store-specific index tables for GraphQL queries:**

| Table | Purpose | What Queries It |
|-------|---------|-----------------|
| `catalog_category_product_index` | Base index | Admin, some REST APIs |
| `catalog_category_product_index_store1` | Store 1 index | **GraphQL, Frontend** |

The native indexer was populating the base table but failing to populate the store-specific table. This is a **known Magento bug** documented in multiple GitHub issues:
- GitHub #10591: Indexer clears table before rebuilding (race condition)
- GitHub #9676: `is_parent` flag corruption during import
- MDVA-40550: Lock timeout during concurrent reindex

**Additionally found:** SQL bug at `AbstractAction.php:584` - extra space in JOIN condition (`'cpe. '` instead of `'cpe.'`)

### Fix Implemented

Updated `bin/fix-index` to populate **both** tables:

1. **Steps 1-2:** Populate base `catalog_category_product_index` (existing)
2. **Steps 3-4:** Populate `catalog_category_product_index_store1` (NEW)

**Before fix:**
```
catalog_category_product_index (base):   2,445 rows for Keller Williams
catalog_category_product_index_store1:   52 rows ❌
GraphQL total_count:                     0 ❌
```

**After fix:**
```
catalog_category_product_index (base):   4,849 rows
catalog_category_product_index_store1:   4,849 rows ✅
GraphQL total_count:                     4,849 ✅
```

### Usage

The fix runs automatically after `bin/import-all-artists`. To run manually:

```bash
bin/fix-index
```

### Verification

```bash
# Check index counts for a category (e.g., Keller Williams = 1510)
bin/mysql -e "SELECT COUNT(*) FROM catalog_category_product_index_store1 WHERE category_id = 1510;"

# Test GraphQL query
curl -X POST https://magento.test/graphql -H "Content-Type: application/json" -k -d '{
  "query": "{ products(filter: {category_id: {eq: \"1510\"}}, pageSize: 1) { total_count } }"
}'
```

### Files Modified

| File | Change |
|------|--------|
| `bin/fix-index` | Added Steps 3-4 to populate `catalog_category_product_index_store1` |

### Known Upstream Bug (Not Fixed)

**File:** `src/vendor/mage-os/module-catalog/Model/Indexer/Category/Product/AbstractAction.php:584`

```php
// Bug: Extra space after 'cpe.'
'cpvd.' . $productLinkField . ' = cpe. ' . $productLinkField  // ← 'cpe. ' should be 'cpe.'
```

This bug exists in Mage-OS/Magento core. Our `bin/fix-index` workaround bypasses this issue entirely.

---

## Artist Status Tracking Fix - UPDATED (2026-01-31)

**Status:** ✅ Fixed - `archivedotorg_artist_status` table now syncs correctly

### Problems Fixed

**Bug 1: Column Name Mismatches (Dashboard/Cron)**
- Dashboard.php queried `tracks_matched`, `tracks_unmatched` but schema has `matched_tracks`, `unmatched_tracks`
- AggregateDailyMetrics.php queried `match_rate` but schema has `match_rate_percent`
- Result: Dashboard stats always showed 0

**Bug 2: Missing Row Creation**
- `BaseLoggedCommand.updateArtistStats()` used UPDATE only
- No code created rows in `archivedotorg_artist_status`
- Result: UPDATE silently failed (0 rows affected)

**Bug 3: Missing collection_id in Import Records**
- Commands didn't save `collection_id` to `archivedotorg_import_run`
- Result: `updateArtistStats()` couldn't create rows with proper collection_id

### Fixes Applied

| File | Change |
|------|--------|
| `Admin/Block/Adminhtml/Dashboard.php` | Fixed column names: `matched_tracks`, `unmatched_tracks` |
| `Admin/Cron/AggregateDailyMetrics.php` | Fixed column names: `matched_tracks`, `unmatched_tracks`, `match_rate_percent` |
| `Core/Console/Command/BaseLoggedCommand.php` | Added `setCollectionId()` method; `updateArtistStats()` now uses `insertOnDuplicate` to create rows |
| `Core/Console/Command/DownloadCommand.php` | Call `setCollectionId()` to populate import_run record |
| `Core/Console/Command/PopulateCommand.php` | Call `setCollectionId()` to populate import_run record |
| `Core/Console/Command/ImportShowsCommand.php` | Call `setCollectionId()` to populate import_run record |
| `bin/sync-artist-status` | Enhanced to create missing rows and sync downloaded_shows + imported_tracks |

### Checking Artist Import Status

**The `archivedotorg_artist_status` table may be out of sync.** Use these methods:

#### Quick Check: Count Actual Files
```bash
docker exec 8pm-phpfpm-1 bash -c 'for dir in /var/www/html/var/archivedotorg/metadata/*/; do
    name=$(basename "$dir");
    count=$(ls -1 "$dir"*.json 2>/dev/null | wc -l);
    echo "$name: $count shows";
done' | sort
```

#### Sync Status Table
```bash
bin/sync-artist-status
```

#### Status Determination
| Metadata Files | imported_tracks | Status |
|---------------|-----------------|--------|
| 0 | 0 | Need `archive:download` |
| > 0 | 0 | Need `archive:populate` |
| > 0 | > 0 | Populated |

#### Verify Database vs Filesystem
```bash
bin/mysql -e "SELECT artist_name, collection_id, downloaded_shows, imported_tracks FROM archivedotorg_artist_status ORDER BY artist_name;"
```

---

## Overview
Mage-OS 1.0.5 (Magento Open Source fork) as headless backend with Next.js/React frontend.

## MCP Servers (Model Context Protocol)

Claude Code has access to project-specific MCP tools for Docker, Redis, and MySQL.

**Zero setup required** - bundles are pre-built and committed to git.

### Available MCP Tools

| Server | Tools | Use Case |
|--------|-------|----------|
| `mysql-8pm` | `query`, `execute`, `list_tables`, `describe_table` | Database queries |
| `docker-8pm` | `list_containers`, `container_logs`, `container_exec`, `container_restart`, `container_stats` | Container management |
| `redis-8pm` | `keys`, `get`, `hgetall`, `ttl`, `info`, `dbsize`, `del`, `del_pattern`, `flushdb`, `magento_cache_stats` | Cache inspection |

### How It Works

```
.mcp.json           → Tells Claude Code which MCPs to load
mcp/docker-8pm/     → Docker MCP (scoped to 8pm-* containers only)
mcp/redis-8pm/      → Redis MCP (connects to port 6380)
```

Claude automatically uses these tools when relevant:
- "Check container logs" → uses `docker-8pm`
- "What's in the cache?" → uses `redis-8pm`
- "Query the database" → uses `mysql-8pm`

### For Developers: Modifying MCPs

If you change `mcp/*/src/index.ts`, rebuild the bundle:

```bash
cd mcp/docker-8pm  # or redis-8pm
npm install        # first time only
npx esbuild src/index.ts --bundle --platform=node --target=node18 --format=cjs --outfile=bundle.cjs
git add bundle.cjs
git commit -m "Rebuild MCP bundle"
```

See `mcp/*/README.md` for full documentation.

---

## ⚠️ IMPORTANT - Frontend Port
**The Next.js frontend ALWAYS runs on port 3001, not 3000.**
- Development: `cd frontend && npm run dev` → http://localhost:3001
- Never use port 3000 - it will cause confusion

## Quick Start

```bash
bin/start   # Start Magento containers
bin/stop    # Stop Magento containers

# Frontend (separate - runs on port 3001)
cd frontend && npm run dev
```

## Project Control Center (`bin/rs`)

Comprehensive command center with **arrow key navigation** for managing all project services and operations.

**Interactive menu with arrow keys:**
```bash
bin/rs              # Interactive TUI menu (use ↑↓ arrows, Enter to select, q to quit)
bin/rs help         # Show all available commands
```

**Navigation:**
- `↑` / `↓` arrows - Navigate through menu options
- `Enter` - Execute selected command
- `q` - Quit menu
- Visual highlighting with `▶` indicator

**Quick examples:**
```bash
# Restart services
bin/rs phpfpm              # Restart PHP-FPM
bin/rs frontend            # Restart Next.js (clears .next cache)
bin/rs web                 # Restart Nginx + PHP-FPM
bin/rs all                 # Restart everything

# Magento operations
bin/rs cache-flush         # Clear all Magento cache
bin/rs reindex             # Reindex all
bin/rs compile             # DI compile
bin/rs full-deploy         # Full deployment (upgrade + compile + static + cache + index)

# Development tools
bin/rs fixperms            # Fix file permissions
bin/rs xdebug-on           # Enable Xdebug
bin/rs status              # Health check all services
bin/rs ports               # Check port usage

# Workflows
bin/rs quick-fix           # Cache + compile (fast)
bin/rs after-pull          # Full post-git-pull workflow
bin/rs reset-dev           # Reset development environment

# Docker operations
bin/rs ps                  # Container status
bin/rs docker-logs         # Tail all logs
bin/rs docker-clean        # Clean volumes/orphans

# Monitoring
bin/rs logs-phpfpm         # Tail PHP-FPM logs
bin/rs logs-all            # Tail all service logs
```

### Command Categories

**Restart Services:**
- Individual: `app`, `phpfpm`, `db`, `redis`, `opensearch`, `rabbitmq`, `mailcatcher`, `phpmyadmin`, `frontend`
- Groups: `backend`, `web`, `data`, `cache`, `all`

**Magento Cache & Index:**
- `cache-flush`, `cache-clean`, `reindex`, `index-status`, `index-reset`

**Magento Setup & Deploy:**
- `compile`, `upgrade`, `static-deploy`, `mode-dev`, `mode-prod`, `mode-show`, `full-deploy`

**Magento Config & Modules:**
- `module-status`, `config-import`, `config-export`

**Docker Operations:**
- `docker-rebuild`, `docker-logs`, `docker-clean`, `docker-reset-db`, `ps`

**Development Tools:**
- `fixperms`, `fixowns`, `xdebug-on`, `xdebug-off`, `xdebug-status`

**Monitoring & Logs:**
- `logs-app`, `logs-phpfpm`, `logs-db`, `logs-all`, `status`, `ports`

**Workflows:**
- `quick-fix` - Cache + compile (use after code changes)
- `after-pull` - Full workflow after git pull (composer + upgrade + compile + cache + index + npm install)
- `reset-dev` - Reset entire dev environment (stop, clean caches, restart)
- `full-reset` - Complete reset including database (dangerous!)

## URLs

| URL | Purpose |
|-----|---------|
| **http://localhost:3001** | **Next.js Frontend (ALWAYS 3001)** |
| https://magento.test/graphql | GraphQL API |
| https://magento.test/admin | Admin Panel |
| http://localhost:8080 | phpMyAdmin |
| http://localhost:1080 | Mailcatcher |

## Admin Credentials
- Username: `john.smith`
- Password: `password123`

## Services & Ports

| Service | Container | Host Port | Internal Port |
|---------|-----------|-----------|---------------|
| **Frontend** | npm run dev | **3001** | **3001** |
| Nginx | 8pm-app-1 | 80, 443 | 8000, 8443 |
| PHP-FPM | 8pm-phpfpm-1 | - | 9000 |
| MariaDB | 8pm-db-1 | 3307 | 3306 |
| Redis/Valkey | 8pm-redis-1 | 6380 | 6379 |
| OpenSearch | 8pm-opensearch-1 | 9201, 9301 | 9200, 9300 |
| RabbitMQ | 8pm-rabbitmq-1 | 15673, 5673 | 15672, 5672 |
| Mailcatcher | 8pm-mailcatcher-1 | 1080 | 1080 |
| phpMyAdmin | 8pm-phpmyadmin-1 | 8080 | 80 |

**Note:**
- **Frontend runs on port 3001 (via npm, not Docker)** - Docker frontend service is disabled in compose.yaml
- Non-standard host ports (3307, 6380, etc.) are used to avoid conflicts with other Docker projects
- **phpMyAdmin** only runs in dev mode (loaded from compose.dev.yaml)

## Common Commands

```bash
bin/magento <command>     # Run Magento CLI
bin/composer <command>    # Run Composer
bin/mysql                 # Access MySQL CLI
bin/bash                  # Shell into PHP container
bin/restart               # Restart containers
bin/status                # Check container status
bin/check-status          # Archive data health (products, indexes, GraphQL)
bin/xdebug enable         # Enable Xdebug
bin/xdebug disable        # Disable Xdebug
bin/cache-clean           # Watch and auto-clean cache
bin/fixowns               # Fix file ownership
bin/fixperms              # Fix file permissions
```

## Magento CLI Examples

```bash
bin/magento cache:flush                    # Clear cache
bin/magento indexer:reindex                # Reindex
bin/magento setup:upgrade                  # Run upgrades after module changes
bin/magento setup:di:compile               # Compile DI
bin/magento setup:static-content:deploy -f # Deploy static content
bin/magento module:status                  # List modules
bin/magento deploy:mode:show               # Show deploy mode
```

## Database Access

**Via CLI:**
```bash
bin/mysql
```

**Via phpMyAdmin:**
- URL: http://localhost:8080
- Server: db
- Username: magento
- Password: magento

**Direct connection (from host):**
- Host: 127.0.0.1
- Port: 3307
- Database: magento
- Username: magento
- Password: magento

## File Structure

```
8pm/
├── bin/              # Helper scripts (75+ available)
├── compose.yaml      # Docker Compose config (frontend disabled - runs on host)
├── docs/             # Project documentation
│   ├── album-artwork/    # Album artwork integration docs (blocked)
│   ├── frontend/         # Accessibility, search fix docs
│   └── import-rearchitecture/  # ETL rearchitecture plans
├── env/              # Environment files
│   ├── db.env
│   ├── magento.env
│   ├── opensearch.env
│   ├── phpfpm.env
│   └── rabbitmq.env
├── frontend/         # Next.js frontend (runs on host, port 3001)
├── src/              # Magento source code
│   └── app/code/ArchiveDotOrg/  # Custom modules
└── CLAUDE.md         # This file
```

## Notes

- **2FA disabled** for development convenience
- **MariaDB 10.6** used (Mage-OS 1.0.5 doesn't support MariaDB 11.x)
- **Valkey** used instead of Redis (drop-in replacement)
- **OpenSearch 2.12** used instead of Elasticsearch
- Source code is in `src/` directory after installation
- SSL certificate auto-generated and trusted locally
- **Docker loads multiple compose files:** compose.yaml + compose.healthcheck.yaml + compose.dev.yaml
- **75+ bin/ scripts available** - run `ls bin/` to see all options
- **Bind mounts with `:cached` flag** - Entire `src/` directory syncs instantly (<100ms) via VirtioFS

## File Sync (Automatic via Bind Mounts)

Files are automatically synchronized between your Mac and Docker containers using **bind mounts with VirtioFS**. Changes appear instantly in both directions (<100ms).

**What gets synced (bind mounts):**
- `src/` - Entire Magento installation (instant bidirectional sync)

**What stays in containers only (named volumes):**
- `/var/www/html/generated/` - Auto-generated code
- `/var/www/html/var/` - Cache, logs, sessions
- `/var/www/html/vendor/` - Composer dependencies
- `/var/www/html/pub/static/` - Static content cache

**Workflow:**
1. Edit files on your Mac in `src/`
2. Changes appear **instantly** in Docker container (<100ms)
3. Files created in container appear instantly on Mac
4. No manual scripts needed!

**Permissions:**
If you create new files and see permission errors:
```bash
bin/fixowns   # Fix ownership (www-data:www-data)
bin/fixperms  # Fix permissions (755/644)
```

## Troubleshooting

**Containers won't start (port conflicts):**
```bash
docker ps -a  # Check for other containers using same ports
bin/stop && bin/start
```

**Permission issues:**
```bash
bin/fixowns
bin/fixperms
```

**Clear all caches:**
```bash
bin/magento cache:flush
bin/magento cache:clean
```

**Re-run setup after DB issues:**
```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f
```

## Frontend Development

### Running the Frontend
```bash
cd frontend
npm run dev
# Always runs on http://localhost:3001
```

### ⚠️ IMPORTANT - Cache Management (FOR CLAUDE)
**ALWAYS use these helper scripts instead of manually deleting `.next/` or cache files:**

```bash
frontend/bin/refresh   # Kill server, clean cache, restart (SAFEST - use this)
frontend/bin/clean     # Clean cache only (only if server NOT running)
npm run refresh        # Shortcut (from frontend/)
```

**When Claude should use `frontend/bin/refresh`:**
- Changes not appearing after editing files (stale `.next/` cache)
- TypeScript errors that won't resolve
- After git pull or branch switching
- "Cannot find module" errors related to `.next/`
- Before major code changes that might affect build
- **NEVER manually delete `.next/` while server is running - always use bin/refresh**

**How it works:**
1. Kills any process on port 3001
2. Removes `.next/`, `tsconfig.tsbuildinfo`, `node_modules/.cache/`
3. Restarts dev server (~1.3s startup)
4. Always safe to run

**Hot Module Replacement (HMR) is enabled:**
- Most file saves should auto-refresh in <2 seconds
- Only use `bin/refresh` when HMR fails or cache is stale
- Startup time of ~1.3s indicates healthy dev environment

### Theme
- **Only Campfire theme is available** (warm analog aesthetic)
- Theme switcher has been removed - hardcoded to `theme-campfire`
- Color palette: Dark backgrounds (`#1c1a17`), warm accents (`#d4a060`, `#e8a050`)
- Layout:
  - Desktop: Left sidebar navigation
  - Mobile: Bottom tab navigation with haptic feedback

### Key Frontend Files
- `frontend/context/ThemeContext.tsx` - Theme provider (hardcoded to campfire)
- `frontend/components/ClientLayout.tsx` - Main layout wrapper
- `frontend/components/JamifyTopBar.tsx` - Desktop top bar
- `frontend/components/JamifyNavSidebar.tsx` - Desktop left sidebar
- `frontend/components/JamifyMobileNav.tsx` - Mobile bottom nav
- `frontend/package.json` - Dev server configured for port 3001

### Environment Variables
File: `frontend/.env.local`
```bash
MAGENTO_GRAPHQL_URL=https://magento.test/graphql
NEXT_PUBLIC_MAGENTO_MEDIA_URL=https://magento.test/media
NODE_TLS_REJECT_UNAUTHORIZED=0  # Allow self-signed certs in dev
# NEXT_PUBLIC_SUPABASE_URL=...  # Optional cross-device sync (disabled)
```

### Audio Features (New - Jan 2026)
- **Audio Visualizations** (`frontend/components/AudioVisualizations.tsx`)
  - VUMeter, SpinningReel, Waveform, EQBars, PulsingDot
- **Crossfade** (`frontend/hooks/useCrossfade.ts`) - Smooth track transitions
- **Audio Analyzer** (`frontend/hooks/useAudioAnalyzer.ts`) - Web Audio API integration
- **Keyboard Shortcuts** - Space (play/pause), N/P (next/prev), S (shuffle), R (repeat)
- **Sleep Timer** (`frontend/hooks/useSleepTimer.ts`) - Auto-pause with preset durations
- **Media Session API** (`frontend/hooks/useMediaSession.ts`) - Lock screen controls
- **Haptic Feedback** (`frontend/hooks/useHaptic.ts`) - Vibration API for mobile

### Artist Page Features
- **Band Members Timeline** (`frontend/components/BandMembersTimeline.tsx`)
  - Visual timeline showing member history, instruments, tenure
  - Distinguishes current vs. former members
- **Band Statistics** - Metrics visualization for artists
- **Band Biography, Links, Social Widgets** - Artist info components

### Spotify Feature Parity
**Current Status: ~70% (Phase 1 Complete)**

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1 | ✅ Done | Search, Like button, Library, Playlists, Recently played |
| Phase 2 | ⏳ Planned | Queue save, Sleep timer UI, Lyrics, Share |
| Phase 3 | ⏳ Planned | Haptic polish, Crossfade UI, Follow artists, Cast |

See `docs/SPOTIFY_FEATURE_PARITY_ROADMAP.md` for full details.

## Custom Magento Modules

### ArchiveDotOrg_Core
Imports live concert recordings from Archive.org into Magento products.

**CLI Commands (26 total):**
```bash
# Import & Sync
bin/magento archive:import:shows "Grateful Dead" --limit=50
bin/magento archive:sync:albums
bin/magento archive:refresh:products "STS9" --fields=rating,downloads
bin/magento archive:cleanup:products --collection=GratefulDead

# Metadata & Tracks
bin/magento archive:download "Phish"              # Download with logging
bin/magento archive:download:metadata "Phish"     # Direct download
bin/magento archive:populate                      # Hybrid track matching
bin/magento archive:populate:tracks               # Legacy track matching

# Artist Enrichment
bin/magento archive:artist:enrich "Phish" --fields=bio,origin,stats --force

# Album Artwork
bin/magento archive:artwork:download "Phish" --limit=20
bin/magento archive:artwork:update
bin/magento archive:artwork:set-url <category_id> <url>
bin/magento archive:artwork:retry

# Setup & Validation
bin/magento archive:setup                         # Setup artists from YAML
bin/magento archive:validate                      # Validate YAML config
bin/magento archive:show-unmatched                # Show unmatched tracks

# Migration Tools
bin/magento archive:migrate:export                # Export to YAML
bin/magento archive:migrate:organize-folders      # Reorganize folders

# Performance Benchmarks
bin/magento archive:benchmark:dashboard           # Benchmark dashboard queries
bin/magento archive:benchmark:import              # Benchmark import strategies
bin/magento archive:benchmark:matching            # Benchmark matching algorithms

# Utilities
bin/magento archive:status --test-collection=GratefulDead
bin/magento archive:cleanup:cache                 # Cleanup old cache files
```

**REST API Endpoints:** (require admin token)
```
POST   /V1/archive/import              - Start import job
GET    /V1/archive/import/:jobId       - Get job status
DELETE /V1/archive/import/:jobId       - Cancel running job
GET    /V1/archive/collections         - List configured collections
GET    /V1/archive/collections/:id     - Get collection details
DELETE /V1/archive/products/:sku       - Delete imported product
```

**Cron Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| `archivedotorg_import_shows` | Configurable (default: 2 AM daily) | Auto-import from collections |
| `archivedotorg_sync_albums` | 4 AM daily | Sync categories with products |
| `archivedotorg_cleanup_progress` | Sunday midnight | Clean stale progress files |
| `archivedotorg_process_import_queue` | Every minute | Process async import queue |
| `aggregate_daily_metrics` | 4 AM daily | Aggregate admin dashboard metrics |

**GraphQL Extensions:** 20+ fields on ProductInterface (song_title, show_venue, archive_downloads, etc.)

**Import History Tracking:** (NEW - 2026-01-29)
All CLI imports automatically log to `archivedotorg_import_run` table with:
- ✅ WHO ran it (`started_by`: cli:username or admin:username)
- ✅ WHAT command ran (`command_name`)
- ✅ WHEN it started/completed (timestamps)
- ✅ HOW LONG it took (`duration_seconds`)
- ✅ HOW MUCH memory used (`memory_peak_mb`)
- ✅ HOW MANY items processed/successful
- ✅ Auto-updates `archivedotorg_artist_status` after successful imports

View in Admin: **Catalog > Archive.org > Import History** (21 records currently)

**Database Tables:**
- `archivedotorg_activity_log` - Import operation tracking
- `archivedotorg_import_run` - Import history with full metrics (NEW)
- `archivedotorg_artist_status` - Per-artist statistics (auto-updated)
- `archivedotorg_studio_albums` - Album artwork cache

**Admin Interface:** Catalog > Archive.org
- **Control Center** - AJAX dashboard with real-time operations
- **Dashboard** - Database statistics and historical metrics
- **Artists** - Per-artist status and match rates
- **Imported Products** - Grid of all imported products
- **Import History** - Full audit trail of imports
- **Import Jobs** - CLI instructions (async jobs coming soon)
- **Unmatched Tracks** - Failed matches with YAML export
- **Configuration** - Module settings

### Album Artwork Integration
**Status:** 🚨 BLOCKED - MusicBrainz/CoverArtArchive blocking connections

**Workaround:** Wikipedia API is working as fallback for artwork.

**When unblocked:**
1. Start proxy: `bin/proxy` (runs on port 3333)
2. Run: `bin/magento archive:artwork:download "Artist" --limit=10`

See `docs/album-artwork/` for full documentation.

### Artist Enrichment
**Status:** ✅ COMPLETE - Multi-tier enrichment system

**Populates Category Attributes:**
- `band_extended_bio` - Biography from Wikipedia
- `band_origin_location` - City/country of origin
- `band_years_active` - Active years
- `band_formation_date` - Year band formed
- `band_genres` - Musical genres
- `band_official_website` - Official website URL
- `band_facebook`, `band_instagram`, `band_twitter` - Social media links
- `band_total_shows` - Total recorded shows (from local database)
- `band_most_played_track` - Most frequently played track (from local database)

**Data Sources:**
1. Wikipedia REST API (bio, thumbnail)
2. Wikipedia Infobox parsing (origin, genres, years_active, website)
3. Brave Search API (social media links - requires API key)
4. Archive.org Stats (total shows, most played track - from imported products)

**Usage:**
```bash
# Enrich single artist with all fields
bin/magento archive:artist:enrich "Phish" --force

# Enrich with specific fields
bin/magento archive:artist:enrich "Phish" --fields=bio,origin,stats

# Enrich all 35 configured artists
bin/magento archive:artist:enrich --all --fields=bio,origin,stats

# Archive.org stats only (requires imported products)
bin/magento archive:artist:enrich "Widespread Panic" --fields=stats --force
```

**Performance:**
- Wikipedia/Brave Search: ~1.5 seconds per artist
- Archive.org Stats: ~0.07 seconds (pure SQL, no API calls)

See `docs/ARTIST_ENRICHMENT_IMPLEMENTATION.md` for full documentation.

---

## Album Artwork Integration (Updated 2026-01-29)

**Status:** ✅ **FUNCTIONAL** - Using Wikipedia API

**See documentation:**
- Full plan: `docs/album-artwork/ALBUM_ARTWORK_PLAN.md`

**Implementation:**
- ✅ WikipediaClient API integration (primary source)
- ✅ AlbumArtworkService (fetches artist albums from Wikipedia)
- ✅ Database table: `archivedotorg_studio_albums`
- ✅ CLI command: `bin/magento archive:artwork:download "Artist" --limit=20`
- ✅ Services registered in DI container
- ✅ GraphQL query: `studioAlbums(artistName: "...")`
- ✅ Works without proxy (Wikipedia API accessible from Docker)

**Usage:**
```bash
bin/magento archive:artwork:download "Grateful Dead" --limit=20
bin/magento archive:artwork:update    # Update existing albums
bin/magento archive:artwork:retry     # Retry failed albums
```

**Key Files:**
- Service: `src/app/code/ArchiveDotOrg/Core/Model/AlbumArtworkService.php`
- Wikipedia Client: `src/app/code/ArchiveDotOrg/Core/Model/WikipediaClient.php`
- CLI: `src/app/code/ArchiveDotOrg/Core/Console/Command/DownloadAlbumArtCommand.php`
- GraphQL: `src/app/code/ArchiveDotOrg/Core/etc/schema.graphqls`
- Database: `archivedotorg_studio_albums` table

**Note:** MusicBrainz proxy exists but is not used. Wikipedia API provides reliable album artwork without SSL issues.

---

## Magento Headless Architecture (Updated 2026-01-28)

### Architecture
- **Frontend:** Runs on HOST (port 3001) - Docker frontend service disabled in compose.yaml
- **Backend:** Magento runs in Docker containers
- **Theme:** Campfire (warm analog aesthetic) - theme switcher removed

### Frontend Cache Management - IMPORTANT FOR CLAUDE

**Always use helper scripts, never manually delete cache:**

```bash
cd frontend
bin/refresh   # Kill server, clean cache, restart (SAFEST)
bin/clean     # Clean cache only (only if server NOT running)
```

**When to use `frontend/bin/refresh`:**
- Changes not appearing after editing files (stale `.next/` cache)
- TypeScript errors that won't resolve
- After git pull or branch switching
- "Cannot find module" errors related to `.next/`
- Before major code changes
- **NEVER manually delete `.next/` while server is running**

**Frontend Details:**
- Runs on port **3001** (not 3000)
- Next.js with HMR enabled (most changes should be instant)
- Only use refresh scripts when HMR fails or cache is stale
- Healthy startup time: ~1.3 seconds

**New Features (Jan 2026):**
- Audio visualizations (VUMeter, Waveform, EQBars, etc.)
- Crossfade between tracks
- Keyboard shortcuts, sleep timer, media session API
- Band members timeline on artist pages

**Quick diagnostics:**
- If site not loading on port 3001: `cd frontend && bin/refresh`
- Frontend always runs outside Docker (via npm)
