Start the 8PM project in production mode.

## Instructions

Check the user's message for purge keywords:
- If the user mentions "purge", "clean", "fresh", "clear cache", "rebuild", or "force": use `--purge` flag
- Otherwise: no flag

Run the appropriate command:

```bash
# Normal startup
bin/prod-up

# Purge mode (clears caches, forces rebuild)
bin/prod-up --purge
```

The script handles:
1. Pre-flight check (skips if already running)
2. Docker containers startup
3. GraphQL API wait
4. Frontend startup (builds if needed, ~3 minutes)

**Purge mode** additionally:
- Stops all services first
- Clears Redis cache
- Removes frontend `.next` and `node_modules/.cache`
- Clears Magento `generated/` and `var/cache/`
- Forces frontend rebuild

Report the output to the user. After success, confirm URLs:
- Frontend: http://localhost:3001
- GraphQL: https://magento.test/graphql
- Admin: https://magento.test/admin

Do NOT run any commands beyond what is listed above.
