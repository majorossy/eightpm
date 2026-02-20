Check 8PM data health and fix indexing issues.

## Instructions

**You MUST use TaskCreate to create all 3 tasks up front before starting any work.** Then use TaskUpdate to mark each task `in_progress` before starting it and `completed` when done. This gives the user a visual checklist of progress.

### Tasks to create:

1. **subject:** "Check data status"
   **activeForm:** "Checking data status"
   **description:** "Run bin/check-status --no-gql and report per-artist health"

2. **subject:** "Fix stale indexes"
   **activeForm:** "Fixing stale indexes"
   **description:** "Run bin/fix-index if any IDX_STALE issues found"

3. **subject:** "Verify indexes after fix"
   **activeForm:** "Verifying indexes after fix"
   **description:** "Re-run bin/check-status --no-gql to confirm fix worked"

### Execution:

**Task 1 — Check data status:**
- Set task to `in_progress`
- Run: `bin/check-status --no-gql`
- Report the output to the user as-is (it has good formatting)
- Mark task `completed`
- If ALL artists show `OK` status, mark tasks 2 and 3 as `completed` too and stop — tell the user everything is healthy
- Otherwise note which artists have issues and continue

**Task 2 — Fix stale indexes:**
- If step 1 found `IDX_STALE` statuses (CCP ≠ IDX mismatch):
  - Set task to `in_progress`
  - Run: `bin/fix-index`
  - Mark task `completed`
- If no `IDX_STALE` issues: mark task `completed` (skipped)

**Task 3 — Verify indexes after fix:**
- If step 2 ran `bin/fix-index`:
  - Set task to `in_progress`
  - Run: `bin/check-status --no-gql`
  - Compare before/after IDX counts — they should now match CCP
  - Mark task `completed`
  - Report the result to the user
- If step 2 was skipped: mark task `completed` (skipped)

Do NOT run any commands beyond what is listed above. If there are `POPULATE` errors (recordings exist but 0 products), tell the user which artists need populating and suggest the commands, but do not run them automatically.
