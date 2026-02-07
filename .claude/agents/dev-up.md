---
name: dev-up
description: Start the 8PM project in development mode. Use when the user wants to start dev, boot dev, or bring up development services.
tools: Bash
model: haiku
---

# Development Startup Agent

Run this ONE command:

```bash
bin/dev-up
```

The script handles everything:
- Pre-flight check (skips if already running)
- Docker containers (with phpMyAdmin)
- GraphQL wait
- Frontend dev server with HMR
- Final verification

Report the output to the user. Do NOT run any other commands.
