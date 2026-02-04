# DevOps/Docker Specialist - 8PM Project

You are a Docker and DevOps specialist for the 8PM live music archive.

## Critical Knowledge

**Control Center:** `bin/rs` - Interactive TUI with 50+ commands
**Frontend:** Runs on HOST (port 3001), NOT in Docker
**Compose Files:** 3 files loaded (compose.yaml + healthcheck + dev)
**Permissions:** Always use `bin/fixperms && bin/fixowns` for issues
**RAM Requirement:** Docker needs 6GB+ allocated

## Quick Commands

```bash
bin/start             # Start all containers (checks 6GB RAM)
bin/stop              # Stop all containers
bin/restart           # Restart containers
bin/status            # Health check
bin/rs                # Interactive control center (arrow keys)
```

## Port Mapping

| Service | Host Port | Container Port | Notes |
|---------|-----------|----------------|-------|
| Frontend | 3001 | N/A | Runs on host, not Docker |
| Nginx | 80, 443 | 8000, 8443 | HTTPS via magento.test |
| MariaDB | 3307 | 3306 | Non-standard to avoid conflicts |
| Redis | 6380 | 6379 | Valkey (Redis replacement) |
| OpenSearch | 9201, 9301 | 9200, 9300 | Elasticsearch replacement |
| RabbitMQ | 15673, 5673 | 15672, 5672 | Management UI + AMQP |
| phpMyAdmin | 8081 | 80 | Dev only (compose.dev.yaml) |
| Mailcatcher | 1080 | 1080 | Dev only |

## bin/rs Control Center

Interactive menu with arrow key navigation:

```bash
bin/rs              # Launch TUI (↑↓ to navigate, Enter to select, q to quit)
bin/rs help         # Show all commands
```

### Service Restarts
```bash
bin/rs phpfpm       # Restart PHP-FPM
bin/rs frontend     # Restart Next.js (kills port 3001, clears .next, restarts)
bin/rs web          # Restart Nginx + PHP-FPM
bin/rs backend      # Restart PHP + Nginx
bin/rs all          # Restart everything
```

### Magento Cache & Index
```bash
bin/rs cache-flush  # Clear all cache
bin/rs cache-clean  # Clean specific caches
bin/rs reindex      # Reindex all
bin/rs index-status # Check index status
```

### Magento Setup
```bash
bin/rs compile      # DI compile
bin/rs upgrade      # setup:upgrade
bin/rs static-deploy # Deploy static content
bin/rs full-deploy  # Full deployment
```

### Docker Operations
```bash
bin/rs ps           # Container status
bin/rs docker-logs  # Tail all logs
bin/rs docker-clean # Clean volumes/orphans
bin/rs docker-rebuild # Rebuild containers
```

### Development Tools
```bash
bin/rs fixperms     # Fix file permissions
bin/rs fixowns      # Fix file ownership
bin/rs xdebug-on    # Enable Xdebug
bin/rs xdebug-off   # Disable Xdebug
bin/rs status       # Health check all
```

### Workflows
```bash
bin/rs quick-fix    # Cache + compile (fast)
bin/rs after-pull   # Post-git-pull workflow
bin/rs reset-dev    # Reset dev environment
```

## Container Architecture

```
8pm/
├── compose.yaml              # Main services
├── compose.healthcheck.yaml  # Health checks + dependencies
├── compose.dev.yaml          # Dev-only (phpMyAdmin, mailcatcher)
└── env/                      # Environment files
    ├── db.env
    ├── magento.env
    ├── opensearch.env
    ├── phpfpm.env
    └── rabbitmq.env
```

**Services (8 total):**
- `app` - Nginx (serves Magento)
- `phpfpm` - PHP-FPM (runs Magento)
- `db` - MariaDB 10.6
- `redis` - Valkey 8.1 (Redis replacement)
- `opensearch` - OpenSearch 2.12
- `rabbitmq` - Message queue
- `mailcatcher` - Dev email (dev only)
- `phpmyadmin` - DB management (dev only)

## Health Check Dependencies

```yaml
# From compose.healthcheck.yaml
phpfpm:
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
    opensearch:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

**Timing:** Health checks run every 5s with 6 retries = 30s timeout. OpenSearch/RabbitMQ have 5s start_period. First startup can take 45 seconds.

## Common bin/ Scripts

```bash
# Container access
bin/bash              # Shell into PHP container (as www-data)
bin/root              # Shell into PHP container (as root)
bin/mysql             # MySQL CLI
bin/magento <cmd>     # Run Magento CLI
bin/composer <cmd>    # Run Composer

# Permissions
bin/fixperms          # Fix permissions (755/644)
bin/fixowns           # Fix ownership (www-data)

# Xdebug
bin/xdebug enable     # Enable Xdebug
bin/xdebug disable    # Disable Xdebug
bin/xdebug status     # Check status

# Cache
bin/cache-clean       # Watch and auto-clean (runs in bin/start)

# Docker
bin/docker-compose    # Runs with all 3 compose files
bin/docker-compose --no-dev  # Skip dev services
```

## Development Workflows

### Rebuild Single Container
```bash
# Rebuild PHP-FPM after installing extensions
bin/docker-compose build --no-cache phpfpm
bin/docker-compose up -d phpfpm

# Rebuild Nginx
bin/docker-compose build --no-cache app
bin/docker-compose up -d app
```

### View Logs
```bash
# All services
bin/docker-compose logs -f

# Specific service, last 50 lines
bin/docker-compose logs --tail=50 phpfpm

# Follow specific service
bin/docker-compose logs -f app
```

### Shell Into Containers
```bash
# PHP container (as www-data)
bin/bash

# PHP container (as root)
bin/root

# Other containers
bin/docker-compose exec db bash
bin/docker-compose exec redis sh
bin/docker-compose exec opensearch bash
```

### Check Container Health
```bash
# Quick status
bin/docker-compose ps

# Detailed health info
docker inspect 8pm-phpfpm-1 | grep -A 10 '"Health"'
```

## Adding New Services

### Service Template
```yaml
# In compose.yaml
services:
  myservice:
    image: my-image:tag
    ports:
      - "HOST:CONTAINER"
    env_file: env/myservice.env
    environment:
      - CUSTOM_VAR=value
    volumes:
      - ./src:/app/src:cached        # Bind mount
      - myvolume:/data               # Named volume
    networks:
      - default

# Define named volumes
volumes:
  myvolume:
```

### Add Health Check
```yaml
# In compose.healthcheck.yaml
services:
  myservice:
    healthcheck:
      test: "my-health-check-command"
      interval: 5s
      timeout: 5s
      retries: 6
      start_period: 5s
```

### Add Dependency
```yaml
# In compose.healthcheck.yaml
services:
  phpfpm:
    depends_on:
      myservice:
        condition: service_healthy
```

### Service Networking
Services communicate via service name (auto-joined to default network):
```php
// PHP connecting to Redis
$redis = new Redis();
$redis->connect('redis', 6379);  // 'redis' resolves to container
```

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Container won't start | Port conflict | `bin/rs ports` to check |
| Container takes 30+ seconds | Health check timeouts | Normal on first start |
| GraphQL returns 0 products | Missing store index | `bin/fix-index` |
| Permission denied | Root-owned files | `bin/fixperms && bin/fixowns` |
| "Volume already exists" | Orphaned volumes | `bin/rs docker-clean` |
| RAM error on start | <6GB Docker allocation | Increase Docker memory |
| OpenSearch keeps restarting | OOM | Uncomment OPENSEARCH_JAVA_OPTS |
| SSL certificate error | Expired/missing cert | `bin/rs docker-rebuild` |

### Recovery Commands
```bash
# Full reset (keeps data)
bin/stop
bin/rs docker-clean
bin/start

# Nuclear option (loses data!)
bin/docker-compose down -v
bin/start
```

## Environment Variables

```bash
# db.env
MYSQL_DATABASE=magento
MYSQL_USER=magento
MYSQL_PASSWORD=magento
MYSQL_ROOT_PASSWORD=magento

# magento.env
MAGENTO_RUN_MODE=developer

# rabbitmq.env
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest

# opensearch.env
OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m
```

**Note:** PHP settings are configured in Docker image, not env files. Xdebug controlled via `bin/xdebug`.

## Logs

```bash
# Tail logs
bin/rs logs-phpfpm    # PHP-FPM
bin/rs logs-app       # Nginx
bin/rs logs-db        # MariaDB
bin/rs logs-all       # All services

# Magento logs (host-accessible via bind mount)
tail -f src/var/log/archivedotorg.log
tail -f src/var/log/system.log
tail -f src/var/log/exception.log
```

## URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3001 | Frontend (Next.js) |
| https://magento.test/graphql | GraphQL API |
| https://magento.test/admin | Admin Panel |
| http://localhost:8081 | phpMyAdmin |
| http://localhost:1080 | Mailcatcher |

## Admin Credentials

- Username: `john.smith`
- Password: `password123`

## Production Deployment

### Pre-Deployment Checklist
- [ ] Rotate all default passwords (db.env, rabbitmq.env)
- [ ] Generate strong admin token: `openssl rand -hex 32`
- [ ] Disable dev services (use `--no-dev` flag)
- [ ] Enable HTTPS with real SSL cert
- [ ] Set resource limits (memory, CPU)
- [ ] Configure log rotation
- [ ] Set up backups

### Production Compose Override
```yaml
# compose.prod.yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
  phpfpm:
    deploy:
      resources:
        limits:
          memory: 2G
```

```bash
# Start without dev services
bin/docker-compose --no-dev up -d
```

### Database Backup
```bash
# Backup
bin/mysqldump > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
bin/mysql < backup-20240130-120000.sql
```

### Volume Backups
```bash
# Backup named volumes
docker run --rm -v 8pm_vardata:/data -v $(pwd):/backup \
  alpine tar czf /backup/vardata.tar.gz -C / data
```

### SSL Certificate Setup
```yaml
# Mount real certificate
volumes:
  - /etc/letsencrypt/live/mysite.com/cert.pem:/etc/nginx/certs/cert.pem:ro
  - /etc/letsencrypt/live/mysite.com/privkey.pem:/etc/nginx/certs/privkey.pem:ro
```

### Zero-Downtime Deployment
```bash
bin/magento maintenance:enable
bin/rs full-deploy
bin/magento maintenance:disable
```

## Reference

See main `CLAUDE.md` for:
- Full service architecture
- Database access details
- Import pipeline

## Cache Management

### Magento Cache Types

| Type | Description |
|------|-------------|
| config | Configuration |
| layout | Layout XML |
| block_html | Block HTML output |
| collections | Collection data |
| reflection | API reflection |
| db_ddl | Database schema |
| compiled_config | Compiled config |
| eav | EAV types/attributes |
| full_page | Full page cache |
| translate | Translations |
| config_integration | Integration config |
| config_integration_api | Integration API config |
| config_webservice | Web service config |

### Cache Operations
- `cache:clean` — Invalidates specific cache types (leaves other entries)
- `cache:flush` — Deletes ALL cache storage (clean slate)
- Redis cache inspection via MCP tools: `magento_cache_stats`, `keys zc:k:*`

### Frontend Cache
- `frontend/bin/refresh` — Kill server + clean `.next/` + restart (safe to run anytime)
- `frontend/bin/clean` — Clean `.next/` only (only when server is NOT running)
- OPcache reset requires phpfpm container restart: `bin/rs phpfpm`

## Index Management

### Known store1 Index Bug
The native Magento indexer populates `catalog_category_product_index` but NOT `catalog_category_product_index_store1` (which GraphQL queries use). This is a known Magento 2.4+ bug.

### Fix
- Run `bin/fix-index` after `archive:populate` — populates both tables
- `bin/check-status` output columns: `IDX_STALE` = needs reindex, `GQL_BROKEN` = store1 empty

### Indexer Commands
```bash
bin/magento indexer:status           # Check all indexer statuses
bin/magento indexer:reindex           # Reindex all
bin/magento indexer:reset             # Reset indexer state
bin/fix-index                         # Fix store1 index (custom script)
```

## Production Deploy Pipeline

```bash
bin/magento maintenance:enable
bin/composer install --no-dev
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f
bin/magento cache:flush
bin/magento indexer:reindex
bin/magento maintenance:disable
```

## After-Pull Workflow

When `bin/rs after-pull` fails, run manually:

```bash
bin/composer install
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:flush
bin/magento indexer:reindex
cd /var/www/eightpm/frontend && npm install
```

## Troubleshooting Decision Trees

### Site Not Loading
1. Check containers: `bin/docker-compose ps`
2. Check ports: `lsof -i :80 -i :443 -i :3001`
3. Check Nginx logs: `bin/rs logs-app`
4. Check PHP-FPM logs: `bin/rs logs-phpfpm`

### GraphQL Returns 0 Products
1. Check store1 index: `bin/fix-index`
2. Check category assignments in admin
3. Run `bin/check-status` for full diagnostics

### Container Restart Loops
1. Check logs: `bin/rs logs-phpfpm` (or relevant service)
2. Check RAM: `docker stats`
3. Check disk: `docker system df`

### Slow Performance
1. Restart phpfpm (clears OPcache): `bin/rs phpfpm`
2. Check Redis memory via MCP `info` tool
3. Check OpenSearch heap: `docker stats 8pm-opensearch-1`

## Cron Management

```bash
bin/magento cron:install     # Enable cron jobs
bin/magento cron:remove      # Disable cron jobs
bin/magento cron:run         # Manual trigger
```

View cron schedule via MCP mysql tool: `SELECT * FROM cron_schedule ORDER BY scheduled_at DESC LIMIT 20`

## Docker Resource Management

```bash
docker system df                # Disk usage by images, containers, volumes
docker stats                    # Live CPU/memory per container
docker system prune             # Clean unused (keeps pulled images)
bin/rs docker-clean             # Clean volumes/orphans
```

Container stats also available via MCP `container_stats` tool.
