---
name: prod-up
description: Start the 8PM project in production mode. Use when the user wants to start, boot, or bring up production services.
tools: Bash
model: haiku
---

# Production Startup Agent

Run this ONE command:

```bash
bin/prod-up
```

The script handles everything:
- Pre-flight check (skips if already running)
- Docker containers
- GraphQL wait
- Frontend startup (skips build if .next exists)
- Final verification

Report the output to the user. Do NOT run any other commands.
