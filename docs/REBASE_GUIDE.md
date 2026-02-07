# Git Rebase Guide - Step by Step

## Prerequisites Completed ✅
- [x] Remote switched to `https://github.com/majorossy/8pm.me.git`
- [x] Backup branch created: `backup-before-rebase-20260202-201818`
- [x] Current changes committed

## Step 1: Start the Interactive Rebase

```bash
cd /Users/chris.majorossy/Education/8pm
git rebase -i --root
```

## Step 2: Replace Editor Content

When the editor opens, **delete everything** and paste the following rebase script:

```
# ========================================
# CATEGORY 1: FOUNDATION (keep as-is)
# ========================================
pick 954be3003 Initial commit: 8pm - Magento 2 headless music streaming platform
pick 2c4326803 Add Magento core files to .gitignore

# ========================================
# CATEGORY 2: EARLY FRONTEND FEATURES
# ========================================
pick 6e1956035 Add Archive.org ratings to version carousel cards
pick bade64f15 Fix Archive.org ratings parsing and song duration
pick 6556d8ff5 Fix version carousel location and source display
reword 7149de199 Frontend redesign with dark theme and remove legacy refactored-site

# ========================================
# CATEGORY 3: EARLY FRONTEND WORK (squash messy commits)
# ========================================
reword 9d10ed9a3 tuesday mmornings work
fixup f8ce2d3d3 tuesday mmornings work
reword 14480caf5 buynch more code
fixup 1c58435df buynch more code
fixup 5178e9228 buynch more code
fixup 3ba8315ad buynch more code

# ========================================
# CATEGORY 4: FRONTEND FEATURES (good messages)
# ========================================
pick 02cfea48f Add FestivalHero component and improve homepage layout
pick 2d84cb137 Improve layout spacing and fix artist pagination
pick ddc12b303 Improve album page accordion styling and track listing
pick cc140180f Add audio visualization components

# ========================================
# CATEGORY 5: MORE FRONTEND WORK (squash)
# ========================================
reword ca8ccc991 buynch more code
fixup 685f0e48b buynch more code

# ========================================
# CATEGORY 6: LARGE DUMP COMMITS (edit to split)
# ========================================
edit bb3b81d71 dump of code

# ========================================
# CATEGORY 7: DOCUMENTATION
# ========================================
pick 9af577068 Add import rearchitecture task cards and fix documentation paths
fixup bb313eaac removed undnned docsumentation

# ========================================
# CATEGORY 8: BACKEND PHASES (keep as-is - great messages!)
# ========================================
pick 228370d86 Phase -1 Complete: Interfaces, exceptions, feature flags, test plan
pick 453ccb2ef Phase 0 Complete: Database, concurrency, data integrity, soundex matching
pick 78c4e70ec Phase 1 Complete: Folder migration and file manifest
pick 9a033815d Phase 2 Complete: YAML configuration system
pick 34fd610e3 Phase 3 Complete: Commands and hybrid matching
pick a3f36ceeb Phase 0 Bugfix + Phase 4 Complete: Extended attributes
pick 9789472cc Phase 5 Complete: Admin dashboard
pick af624612f Phase 6 Complete: Testing and documentation

# ========================================
# CATEGORY 9: MORNING/MORE CODE (squash into feature commits)
# ========================================
reword 3633f5e95 morning work
fixup 0fc35a338 morning work
reword 634922510 more code
fixup 5977d3147 more code
fixup 5fc72c91f more code
fixup 9387bb8a0 more code
fixup c5f8fc712 more code
fixup e76cf628c more code
fixup daf9e01a5 more code
fixup 4f15993c3 more code
fixup 52a92923e more code
fixup 170aed183 more code
fixup 9bbc8d78f more code
fixup 306f59961 more code
fixup 0f8cec0b2 more code
fixup fcc93126f more code

# ========================================
# CATEGORY 10: CLAUDE WORK (edit to split)
# ========================================
edit 0738a435c code dump lots of claude work

# ========================================
# CATEGORY 11: STUFF COMMITS (edit to split)
# ========================================
edit d7fc4d9f0 stuff
fixup 2018f8d79 stuff
fixup f4a5eadc2 stuff
edit 4786ae904 stuff

# ========================================
# CATEGORY 12: ORE CODE DUMPS (squash)
# ========================================
reword 69fc8b9d3 ore code dump
fixup feb2900ac ore code dump

# ========================================
# CATEGORY 13: RECENT GOOD COMMITS (keep as-is)
# ========================================
pick 19370010f Rebrand from EIGHTPM/8PM to 8pm.me
pick 9a610064b Add Share button to player and equalizer animations
pick cf3197fb2 Add queue preview tooltip on hover
pick aa08d3029 Add download button, keyboard hints, and track progress persistence
pick 19bc4e38f Add resume playback UI when returning to site
pick fbf3188a1 Add mini queue to mobile full player

# ========================================
# CATEGORY 14: ADF COMMITS (squash into one)
# ========================================
reword 567426451 adf
fixup 8661999ca adf
fixup 90e4e476c adf
fixup f0d4d1f8d adf

# ========================================
# CATEGORY 15: FINAL DOCS
# ========================================
pick 176cb5c97 docs: add git history reorganization plan
```

## Step 3: Save and Close Editor

Save the file and close the editor. Git will begin processing.

## Step 4: Handle `reword` Prompts

For each `reword` commit, git will open an editor. Use these replacement messages:

### 7149de199 (Frontend redesign)
```
feat(frontend): complete dark theme redesign with Campfire aesthetic

- Remove legacy refactored-site directory
- Implement warm analog color palette
- Add desktop sidebar and mobile bottom nav
```

### 9d10ed9a3 (tuesday mmornings work)
```
feat(frontend): add early player and navigation features
```

### 14480caf5 (buynch more code)
```
feat(frontend): add authentication and library features
```

### ca8ccc991 (buynch more code)
```
feat(frontend): enhance playlist and queue functionality
```

### 3633f5e95 (morning work)
```
feat(frontend): add search overlay and artist page improvements
```

### 634922510 (more code)
```
feat(backend): add artist enrichment and statistics features
```

### 69fc8b9d3 (ore code dump)
```
feat(frontend): add cookie consent, analytics, and legal pages
```

### 567426451 (adf)
```
chore: miscellaneous fixes and cleanup
```

## Step 5: Handle `edit` Commits

When git stops at an `edit` commit, you need to split it:

### bb3b81d71 (dump of code)
```bash
# Reset to unstage all changes
git reset HEAD^

# Commit 1: Album artwork integration
git add src/app/code/ArchiveDotOrg/Core/Model/AlbumArtworkService.php \
        src/app/code/ArchiveDotOrg/Core/Model/WikipediaClient.php \
        src/app/code/ArchiveDotOrg/Core/Model/MusicBrainzClient.php \
        src/app/code/ArchiveDotOrg/Core/Console/Command/DownloadAlbumArtCommand.php \
        src/app/code/ArchiveDotOrg/Core/Console/Command/RetryMissingArtworkCommand.php \
        src/app/code/ArchiveDotOrg/Core/Console/Command/SetArtworkUrlCommand.php \
        src/app/code/ArchiveDotOrg/Core/Console/Command/UpdateCategoryArtworkCommand.php \
        src/app/code/ArchiveDotOrg/Core/Model/Resolver/StudioAlbums.php \
        src/app/code/ArchiveDotOrg/Core/Setup/Patch/Data/AddWikipediaArtworkUrlAttribute.php
git commit -m "feat(backend): add album artwork integration with Wikipedia API"

# Commit 2: Frontend artist components
git add frontend/components/artist/ \
        frontend/components/ArtistPageContent.tsx \
        frontend/components/ArtistsPageContent.tsx
git commit -m "feat(frontend): add band members timeline and artist page components"

# Commit 3: Import rearchitecture docs
git add IMPORT_REARCHITECTURE_PLAN.md ALBUM_ARTWORK_PROXY.md IMPORT_NOTES.md
git commit -m "docs(import): add import rearchitecture plan and artwork proxy docs"

# Commit 4: Remaining frontend changes
git add frontend/
git commit -m "feat(frontend): enhance album cards and festival hero"

# Commit 5: Everything else
git add .
git commit -m "chore: add musicbrainz proxy and debug files"

# Continue rebase
git rebase --continue
```

### 0738a435c (code dump lots of claude work)
```bash
git reset HEAD^

# Commit 1: Metadata sync system
git add bin/sync-metadata bin/export-metadata bin/organize-metadata
git commit -m "feat(tooling): add metadata sync scripts for Git LFS tracking"

# Commit 2: Artist status tracking
git add bin/sync-artist-status \
        .claude/plans/fix-artist-status-sync.md
git commit -m "feat(backend): add artist status sync system"

# Commit 3: Claude skills documentation
git add .claude/skills/ .claude/rules/
git commit -m "docs: add Claude Code skill guides for development"

# Commit 4: Git LFS setup
git add .gitattributes
git commit -m "chore: configure Git LFS for large metadata files"

# Commit 5: Metadata files (this will be large)
git add data/
git commit -m "feat(data): add Billy Strings metadata files"

# Commit 6: Everything else
git add .
git commit -m "chore: update CLAUDE.md and gitignore"

git rebase --continue
```

### d7fc4d9f0 + 4786ae904 (stuff commits)
```bash
# After d7fc4d9f0 stops:
git reset HEAD^

# These are likely mixed changes - examine first:
git status

# Then commit logically grouped changes
git add <frontend-files>
git commit -m "feat(frontend): add quality selector and offline support"

git add <backend-files>
git commit -m "feat(backend): enhance track importer"

git add .
git commit -m "chore: miscellaneous updates"

git rebase --continue
```

### 4786ae904 (stuff - the big one with 67 files)
```bash
git reset HEAD^

# Commit 1: MCP Servers (biggest addition)
git add mcp/docker-8pm/ mcp/redis-8pm/
git commit -m "feat(tooling): add Docker and Redis MCP servers"

# Commit 2: SEO documentation
git add docs/seo-implementation/
git commit -m "docs(seo): add monthly SEO audit checklist"

# Commit 3: Schema.org and sitemap
git add frontend/lib/schema.ts frontend/lib/sitemap.ts frontend/app/sitemap.ts frontend/app/robots.ts
git commit -m "feat(seo): add structured data and sitemap generation"

# Commit 4: Analytics
git add frontend/hooks/useAnalytics.ts frontend/lib/analytics.ts
git commit -m "feat(frontend): add analytics hooks and tracking"

# Commit 5: Static pages
git add frontend/app/about/ frontend/app/contact/ frontend/app/faq/ \
        frontend/app/privacy/ frontend/app/terms/ frontend/app/how-it-works/ \
        frontend/app/tapers/
git commit -m "feat(frontend): add static info pages (about, FAQ, privacy, terms)"

# Commit 6: Artist enrichment components
git add frontend/components/ArtistFAQ.tsx frontend/components/ExpandedBiography.tsx \
        frontend/components/RelatedArtists.tsx frontend/components/TaperNotes.tsx
git commit -m "feat(frontend): add artist FAQ, biography, and related artists components"

# Commit 7: Audio visualizations update
git add frontend/components/AudioVisualizations.tsx
git commit -m "feat(frontend): enhance audio visualizations"

# Commit 8: FestivalSort context
git add frontend/context/FestivalSortContext.tsx frontend/utils/festivalSorting.ts
git commit -m "feat(frontend): add festival sorting context and algorithms"

# Commit 9: Remaining frontend
git add frontend/
git commit -m "feat(frontend): enhance player context and search overlay"

# Commit 10: Backend changes
git add src/
git commit -m "feat(backend): improve bulk product importer and track importer"

# Commit 11: Everything else
git add .
git commit -m "chore: update configuration files"

git rebase --continue
```

## Step 6: Resolve Any Conflicts

If you encounter merge conflicts:

```bash
# Edit the conflicting files to resolve
# Then:
git add <resolved-files>
git rebase --continue
```

## Step 7: Verify the Result

```bash
# Check the new commit count
git log --oneline | wc -l

# Review the log
git log --oneline | head -30

# Verify no functional changes
git diff backup-before-rebase-20260202-201818..HEAD --stat

# Test backend builds
bin/magento setup:upgrade --dry-run

# Test frontend builds
cd frontend && npm run build
```

## Step 8: Push to Remote

```bash
# Force push to 8pm.me (replaces all content)
git push --force origin main
```

## Step 9: Create Tags

```bash
git tag -a v1.0-foundation -m "Foundation and infrastructure" <commit-hash>
git tag -a v1.1-backend -m "Backend import system" <commit-hash>
git tag -a v1.2-frontend -m "Frontend core features" <commit-hash>
git tag -a v1.3-player -m "Audio player complete" <commit-hash>
git push origin --tags
```

## Rollback (if needed)

```bash
# Abort during rebase
git rebase --abort

# Or reset to backup
git reset --hard backup-before-rebase-20260202-201818
```

---

## Quick Reference: Rebase Actions

| Action | What It Does |
|--------|-------------|
| `pick` | Keep commit as-is |
| `reword` | Keep commit, edit message |
| `edit` | Stop to split or modify commit |
| `squash` | Combine with previous, edit combined message |
| `fixup` | Combine with previous, discard this message |
| `drop` | Delete the commit entirely |

---

## Estimated Time

- Rebase script setup: 5 min
- Reword prompts (8): 10 min
- Splitting bb3b81d71: 15 min
- Splitting 0738a435c: 15 min
- Splitting stuff commits: 20 min
- Verification: 15 min
- **Total: ~1.5 hours** (less than the original 4-5 hour estimate since we're using fixup aggressively)
