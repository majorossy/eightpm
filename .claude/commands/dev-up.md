Start the 8PM project in development mode.

## Instructions

Create a task list with these 5 tasks, then work through them sequentially:

1. **Pre-flight check** (activeForm: "Checking if site is already running")
   - Run: `bin/verify-site --dev 2>/dev/null`
   - If it succeeds (exit 0): mark ALL tasks completed, tell the user "Site is already running!" with the URLs, and stop.
   - If it fails: mark this task completed and continue to step 2.

2. **Start Docker containers** (activeForm: "Starting Docker containers")
   - Run: `bin/start`
   - Report any errors. Mark completed when done.

3. **Wait for healthy containers** (activeForm: "Waiting for containers to be healthy")
   - Run: `bin/wait-containers --timeout=90`
   - Mark completed when done.

4. **Wait for GraphQL API** (activeForm: "Waiting for GraphQL API")
   - Run: `bin/wait-graphql --timeout=120`
   - Mark completed when done.

5. **Start frontend dev server** (activeForm: "Starting frontend dev server")
   - Run: `bin/frontend-dev`
   - Mark completed when done.

After all tasks complete, run `bin/verify-site --dev` and report the final status with URLs:
- Frontend: http://localhost:3001
- GraphQL: https://magento.test/graphql
- Admin: https://magento.test/admin
- phpMyAdmin: http://localhost:8080
- Mailcatcher: http://localhost:1080

Do NOT run any commands beyond what is listed above.
