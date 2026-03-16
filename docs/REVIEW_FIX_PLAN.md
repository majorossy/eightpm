# Review Fix Plan — Post-Audit Remediation

**Created:** 2026-03-16
**Scope:** 33 files, 652 additions, 200 deletions
**Source:** 4-agent parallel review (shell scripts, frontend code, tests, integration)

---

## Phase 1: Critical Production Bugs (5 fixes)

### C1 + C2: Frontend build lifecycle (bin/rs + bin/frontend-prod)

**Problem:** Two related bugs in how the frontend build is managed:
- `bin/rs restart_frontend()` deletes `.next/` then restarts PM2 — `next start` requires build output, guaranteed crash
- `bin/frontend-prod` claims "build before stop" but deletes `.next/` on line 25 while old server still runs — 500 errors during ~3min build

**Fix:**
- `bin/rs`: In prod mode, call `bin/frontend-prod` (which handles build+restart) instead of deleting cache + pm2 restart. In dev mode, keep current behavior (delete cache + nohup dev).
- `bin/frontend-prod`: Build into `.next.tmp/`, then stop old server, rename `.next.tmp/` -> `.next/`, start new server. True zero-downtime.

**Files:** `bin/rs`, `bin/frontend-prod`

---

### C3: Wrong GraphQL URL in check-status

**Problem:** `bin/check-status:170` queries `https://magento.8pm.me/graphql` (production) instead of `https://magento.test/graphql` (local dev).

**Fix:** Change URL to `https://magento.test/graphql`.

**Files:** `bin/check-status`

---

### C4 + M3: Stale closure in PlayerContext retry logic

**Problem:** `handlePlaybackError` captures `currentSong` in closure, then uses it inside a 1.5s `setTimeout`. The stale-check compares the same captured reference to itself — never triggers. If user skips during retry delay, wrong song URL gets loaded. Dependency array also missing `currentSong`.

**Fix:** Add a `currentSongIdRef` that tracks current song ID. Compare against that ref inside setTimeout instead of the stale closure variable. Remove `currentSong` from dependency array (ref-based check doesn't need it).

**Files:** `frontend/context/PlayerContext.tsx`

---

### C5: Unsafe JSON.parse in AlbumPageContent

**Problem:** `JSON.parse(shared.version_overrides)` called 3 times on server data with no try-catch. Malformed JSON crashes the entire component tree.

**Fix:** Create a `safeParseOverrides()` helper that returns `{}` on failure. Use it in all 3 locations.

**Files:** `frontend/components/AlbumPageContent.tsx`

---

## Phase 2: Medium Issues (8 fixes)

### M1 + M2: bin/rs interactive menu crash + cursor restore

**Problem:**
- `((selected--))` at position 0 returns exit code 1, crashes script under `set -e`
- No SIGINT/SIGTERM trap — Ctrl+C leaves terminal cursor hidden

**Fix:**
- Replace `((selected--))` with `selected=$((selected - 1))` (and same for `++`)
- Add `trap 'tput cnorm; exit' INT TERM` alongside existing EXIT trap

**Files:** `bin/rs`

---

### M4: Audio event effect depends on entire queueContext

**Problem:** Effect at line 378-513 has `queueContext` in deps — tears down and reattaches all audio listeners on every queue state change.

**Fix:** Destructure only the specific functions used (`advanceCursor`, `peekNext`, etc.) and list those in the dependency array.

**Files:** `frontend/context/PlayerContext.tsx`

---

### M5: ThemeContext setTheme causes unnecessary re-renders

**Problem:** `setTheme` has `[theme]` in dependency array to capture "from" theme for analytics. Recreates on every theme change, causing all consumers to re-render.

**Fix:** Use a `themeRef` to track previous theme, remove `theme` from deps.

**Files:** `frontend/context/ThemeContext.tsx`

---

### M6: Dead code in QualityContext

**Problem:** `isClient` state set but never read.

**Fix:** Remove the dead state variable.

**Files:** `frontend/context/QualityContext.tsx`

---

### M7: Unused parameter in analytics

**Problem:** `trackVersionChange(trackTitle, newVersionId)` — `newVersionId` never used in function body.

**Fix:** Either use it in the GA event params or remove it from the signature (check callers first).

**Files:** `frontend/lib/analytics.ts`

---

### M8: Broken action numbering in check-status

**Problem:** `action_num` incremented inside pipeline subshell — variable lost after loop, always shows 1.

**Fix:** Use process substitution: `while read ... done < <(echo ... | grep | head)`.

**Files:** `bin/check-status`

---

### M9: docker_clean runs system prune without confirmation

**Problem:** `bin/rs docker-clean` runs `docker system prune -f` affecting all Docker resources system-wide, no warning.

**Fix:** Add confirmation prompt inside `docker_clean` function.

**Files:** `bin/rs`

---

### M10: Direct docker exec calls in prod-up

**Problem:** 5 `docker exec 8pm-*` calls hardcode container names instead of using `bin/docker-compose exec`.

**Fix:** Replace with `bin/docker-compose --no-dev exec -T` equivalents.

**Files:** `bin/prod-up`

---

## Phase 3: Low Priority (selected — skip L5, L7 as systemic/low-risk)

### L1: SettingsPanel hover feedback

**Fix:** Change `hover:bg-border` to `hover:bg-border/80`.

**Files:** `frontend/components/player/SettingsPanel.tsx`

---

### L4: Queue test backdrop guard

**Fix:** Replace `if (backdrop)` with `expect(backdrop).not.toBeNull()` + `fireEvent.click(backdrop!)`.

**Files:** `frontend/components/__tests__/Queue.test.tsx`

---

### L9: signIn returns true when getCustomer returns null

**Fix:** Check `customerData` before reporting success.

**Files:** `frontend/context/MagentoAuthContext.tsx`

---

## Phase 4: Test Coverage (deferred — not blocking)

- M11: Add tests for 4 untested reducer actions (DETACH_ITEM, RESTORE_FROM_HISTORY, REMOVE_BATCH, PLAY_NOW)
- M12: Add test files for analytics.ts, useAnalytics.ts, PlayerContext.tsx

These are coverage gaps, not bugs. Defer to a dedicated testing session.

---

## Execution Order

1. Phase 1 criticals (C1-C5) — all independent, can be done in parallel
2. Phase 2 mediums (M1-M10) — mostly independent
3. Phase 3 lows (L1, L4, L9) — quick fixes
4. Phase 4 tests — separate session

## Not Fixing (intentional)

- L2 (URL endsWith): Edge case unlikely with Archive.org URLs
- L3 (effect ordering): Would need React testing to verify, low risk
- L5 (test reimplementations): Systemic pattern, not worth disrupting
- L6 (fix-index set -e): Script is manually run, errors are visible
- L7 (relative paths): Consistent pattern across all bin/ scripts, CWD assumption is documented
- L8 (check-status docker exec): Fixing as part of C3 anyway
- L10 (setState side effects): Works in practice, concurrent mode not enabled
