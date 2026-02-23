# Plan: Remove RabbitMQ from Production

## Context

RabbitMQ is burning **~90% of a CPU core and 180MB RAM** while doing absolutely nothing — 0 queues, 0 connections, 0 consumers. On a 2-vCPU EC2 instance, that's nearly half the CPU wasted. The Archive.org module uses database-backed queues (`connection="db"` in queue XML configs), not AMQP. Removing RabbitMQ frees resources and should noticeably improve build times and overall performance.

## Approach: Comment Out (Not Delete)

Comment out RabbitMQ in compose files (same pattern used for Elasticsearch, frontend, Blackfire). This makes it trivial to re-enable later if needed. Update container counts and service group references.

**Do NOT touch** `src/app/etc/env.php` or `bin/setup-install` — Magento handles missing AMQP gracefully by falling back to DB queues, and setup-install is only run once during initial setup.

## Changes

### 1. `compose.yaml` — Comment out rabbitmq service + volume

Lines 137-145: Comment out the rabbitmq service block
Line 194: Comment out `rabbitmqdata` volume

### 2. `compose.healthcheck.yaml` — Comment out rabbitmq health check + dependency

Lines 30-31: Remove rabbitmq from phpfpm's `depends_on`
Lines 55-58: Comment out rabbitmq health check block

### 3. `bin/wait-containers` — Reduce expected container counts

Line 24: Change `EXPECTED=7` to `EXPECTED=6` (remove rabbitmq from comment too)
Line 26: Change `EXPECTED=8` to `EXPECTED=7` (remove rabbitmq from comment too)

### 4. `bin/rs` — Remove rabbitmq from service groups and lists

Line 29: Remove `rabbitmq` from backend group
Line 35: Remove `rabbitmq` from data group
Line 542: Remove `rabbitmq` from individual service case
Line 714: Remove `rabbitmq` from help text
Line 718: Remove `rabbitmq` from data group help
Line 786: Remove rabbitmq menu entry

## Files Modified

| File | Change |
|------|--------|
| `compose.yaml` | Comment out rabbitmq service + volume |
| `compose.healthcheck.yaml` | Comment out health check, remove depends_on |
| `bin/wait-containers` | Reduce expected counts by 1 |
| `bin/rs` | Remove from service groups, case, help text, menu |

## Files NOT Modified (intentional)

| File | Why |
|------|-----|
| `src/app/etc/env.php` | Magento falls back to DB queue when AMQP unavailable |
| `bin/setup-install` | Only used during initial install, not runtime |
| `env/rabbitmq.env` | Keep for easy re-enable |
| `bin/removevolumes` | Keep — useful if cleaning up the old volume |

## Verification

1. Stop containers: `bin/prod-down` (or `bin/stop`)
2. Start without rabbitmq: `bin/docker-compose --no-dev up -d`
3. Check only 6 containers come up healthy: `bin/wait-containers --no-dev --timeout=90`
4. Verify GraphQL still works: use `graphql-8pm` MCP `query` tool with `{ storeConfig { store_code } }`
5. Check Magento logs for AMQP errors: `filesystem-8pm` MCP `search_logs` for "amqp" in system.log
6. Compare CPU usage: `docker stats --no-stream` — should see significant CPU drop
