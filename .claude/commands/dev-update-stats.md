Recompute all artist stats and verify via GraphQL.

## Instructions

**You MUST use TaskCreate to create all 4 tasks up front before starting any work.** Then use TaskUpdate to mark each task `in_progress` before starting it and `completed` when done. This gives the user a visual checklist of progress.

### Tasks to create:

1. **subject:** "Recompute artist stats"
   **activeForm:** "Recomputing artist stats"
   **description:** "Run archive:artist:enrich --all --fields=stats_extended --force to recompute all stats from product data"

2. **subject:** "Sync artist status table"
   **activeForm:** "Syncing artist status table"
   **description:** "Run bin/sync-artist-status to reconcile downloaded_shows and imported_tracks"

3. **subject:** "Flush Magento cache"
   **activeForm:** "Flushing Magento cache"
   **description:** "Flush all Magento caches so GraphQL serves fresh values"

4. **subject:** "Verify stats via GraphQL"
   **activeForm:** "Verifying stats via GraphQL"
   **description:** "Query GraphQL for Railroad Earth to confirm stats are populated and non-zero"

### Execution:

**Task 1 — Recompute artist stats:**
- Set task to `in_progress`
- Run: `bin/magento archive:artist:enrich --all --fields=stats_extended --force`
- This executes 5 SQL queries per artist (total_shows, most_played_track, total_recordings, total_hours, total_venues)
- Report per-artist results as they complete
- Mark task `completed`

**Task 2 — Sync artist status table:**
- Set task to `in_progress`
- Run: `bin/sync-artist-status`
- Report the sync output
- Mark task `completed`

**Task 3 — Flush Magento cache:**
- Set task to `in_progress`
- Run: `bin/magento cache:flush`
- Mark task `completed`

**Task 4 — Verify stats via GraphQL:**
- Set task to `in_progress`
- Run this curl command to verify stats for Railroad Earth:
  ```
  curl -sk -X POST https://magento.test/graphql -H 'Content-Type: application/json' -d '{"query":"{ categories(filters:{name:{match:\"Railroad Earth\"}}) { items { name band_total_shows band_total_recordings band_total_hours band_total_venues band_most_played_track } } }"}'
  ```
- Parse the JSON response and report the stats values in a readable format
- If any of `band_total_shows`, `band_total_recordings`, `band_total_hours`, `band_total_venues` are 0 or null, flag a warning
- Mark task `completed`

Do NOT run any commands beyond what is listed above.
