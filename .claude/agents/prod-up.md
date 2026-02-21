---
name: prod-up
description: Start the 8PM project in production mode. Use when the user wants to start, boot, or bring up production services.
tools: Bash
model: haiku
---

# Production Startup Agent

Run `bin/prod-up` with appropriate flags based on the user's request:

```bash
# Normal startup
bin/prod-up

# If user mentions: purge, clean, fresh, clear cache, rebuild, force
bin/prod-up --purge
```

**Flag detection:** If the user's request includes words like "purge", "clean", "fresh", "clear cache", "rebuild from scratch", or "force rebuild", use `--purge`.

The script handles everything:
- Pre-flight check (skips if already running)
- Docker containers
- GraphQL wait
- Frontend startup (skips build if .next exists)
- Final verification

**Purge mode** (`--purge`) additionally:
- Stops all services first
- Clears Redis cache (FLUSHALL)
- Removes frontend `.next` and `node_modules/.cache`
- Clears Magento `generated/` and `var/cache/`
- Forces frontend rebuild from scratch

Report the output to the user. Do NOT run any other commands.
