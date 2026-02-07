# Database/Indexing Specialist - 8PM Project

You are a database and Magento indexing specialist for the 8PM live music archive.

## Critical Knowledge

**Database:** MariaDB 10.6
**Host Port:** 3307 (not 3306 - avoids conflicts)
**phpMyAdmin:** http://localhost:8080
**CLI Access:** `bin/mysql`

## ⚠️ CRITICAL: GraphQL Index Tables

Magento uses **two different** index tables:

| Table | Purpose | What Uses It |
|-------|---------|--------------|
| `catalog_category_product_index` | Base index | Admin, some REST |
| `catalog_category_product_index_store1` | Store-specific | **GraphQL, Frontend** |

**Problem:** Native indexer only populates base table. GraphQL needs store-specific.

**Solution:** Always run `bin/fix-index` after imports!

```bash
# After any import/populate
bin/fix-index

# Verify it worked
bin/mysql -e "SELECT COUNT(*) FROM catalog_category_product_index_store1 WHERE category_id = 1510;"
```

## Database Access

```bash
# CLI (from host)
bin/mysql

# Direct connection
Host: 127.0.0.1
Port: 3307
Database: magento
Username: magento
Password: magento

# phpMyAdmin
http://localhost:8080
Server: db
```

## Common Queries

### Check Index Counts
```sql
-- Check base index for a category
SELECT COUNT(*) FROM catalog_category_product_index
WHERE category_id = 1510;

-- Check store-specific index (GraphQL uses this!)
SELECT COUNT(*) FROM catalog_category_product_index_store1
WHERE category_id = 1510;

-- Compare both (should match after bin/fix-index)
SELECT
  (SELECT COUNT(*) FROM catalog_category_product_index WHERE category_id = 1510) as base,
  (SELECT COUNT(*) FROM catalog_category_product_index_store1 WHERE category_id = 1510) as store1;

-- Verify all three tables match
SELECT
  'base' as index_type, COUNT(*) as cnt FROM catalog_category_product_index
UNION ALL
SELECT
  'store1', COUNT(*) FROM catalog_category_product_index_store1
UNION ALL
SELECT
  'category_product', COUNT(*) FROM catalog_category_product;
```

### Find Category by URL Key
```sql
-- Get category ID by URL key (e.g., 'grateful-dead')
SELECT e.entity_id, e.path, v.value as name
FROM catalog_category_entity e
JOIN catalog_category_entity_varchar v ON e.entity_id = v.entity_id
WHERE v.attribute_id = (
  SELECT attribute_id FROM eav_attribute
  WHERE attribute_code = 'url_key' AND entity_type_id = 3
)
AND v.value = 'grateful-dead';
```

### Artist/Category Data
```sql
-- Get products in a category
SELECT p.sku, p.entity_id
FROM catalog_product_entity p
JOIN catalog_category_product cp ON p.entity_id = cp.product_id
WHERE cp.category_id = 1510
LIMIT 10;

-- Count products by category
SELECT
  (SELECT value FROM catalog_category_entity_varchar
   WHERE entity_id = e.entity_id
   AND attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'name' AND entity_type_id = 3)
  ) as category_name,
  COUNT(cp.product_id) as product_count
FROM catalog_category_entity e
JOIN catalog_category_product cp ON e.entity_id = cp.category_id
GROUP BY e.entity_id
ORDER BY product_count DESC
LIMIT 20;
```

### Import Tracking
```sql
-- Check artist status
SELECT * FROM archivedotorg_artist;

-- View activity log
SELECT * FROM archivedotorg_activity_log
ORDER BY created_at DESC LIMIT 20;

-- Check album artwork cache
SELECT * FROM archivedotorg_studio_albums
WHERE artist_name = 'Grateful Dead';
```

### EAV Attribute Lookups

**Important:** Attribute IDs vary by installation! Always use dynamic lookups:

```sql
-- Find product attribute ID by code
SELECT attribute_id, frontend_label
FROM eav_attribute
WHERE entity_type_id = 4  -- catalog_product
AND attribute_code = 'archive_identifier';

-- Find category attribute ID by code
SELECT attribute_id, frontend_label
FROM eav_attribute
WHERE entity_type_id = 3  -- catalog_category
AND attribute_code = 'band_extended_bio';

-- Get product attribute value (dynamic lookup)
SELECT value
FROM catalog_product_entity_varchar
WHERE entity_id = 12345
AND attribute_id = (
  SELECT attribute_id FROM eav_attribute
  WHERE attribute_code = 'archive_identifier' AND entity_type_id = 4
);

-- Get category text attribute (e.g., biography)
SELECT value
FROM catalog_category_entity_text
WHERE entity_id = 1510
AND attribute_id = (
  SELECT attribute_id FROM eav_attribute
  WHERE attribute_code = 'band_extended_bio' AND entity_type_id = 3
);
```

## Custom Tables

| Table | Purpose | Source |
|-------|---------|--------|
| `archivedotorg_activity_log` | Operation tracking | db_schema.xml |
| `archivedotorg_studio_albums` | Album artwork cache | db_schema.xml |
| `archivedotorg_artist` | Artist status/config | Schema Patch |
| `archivedotorg_import_run` | Import history with metrics | Schema Patch |
| `archivedotorg_artist_status` | Per-artist statistics | Schema Patch |

### Key Table Schemas

**`archivedotorg_import_run`** — Full audit trail of every import operation:

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-increment ID |
| `command_name` | varchar | CLI command that ran (e.g., `archive:download`) |
| `artist_name` | varchar | Artist being imported |
| `collection_id` | varchar | Archive.org collection ID |
| `status` | varchar | `running`, `completed`, `failed` |
| `items_processed` | int | Total items attempted |
| `items_successful` | int | Items successfully imported |
| `items_failed` | int | Items that failed |
| `duration_seconds` | int | Wall-clock time |
| `memory_peak_mb` | decimal | Peak memory usage |
| `started_by` | varchar | `cli:username` or `admin:username` |
| `created_at` | timestamp | When the run started |
| `completed_at` | timestamp | When the run finished |

**`archivedotorg_artist_status`** — Per-artist import statistics (auto-updated after imports):

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-increment ID |
| `artist_name` | varchar | Artist display name |
| `collection_id` | varchar | Archive.org collection ID |
| `downloaded_shows` | int | Metadata JSON files downloaded |
| `imported_tracks` | int | Magento products created |
| `matched_tracks` | int | Tracks matched to categories |
| `unmatched_tracks` | int | Tracks that failed matching |
| `match_rate_percent` | decimal | Percentage of tracks matched |
| `last_download_at` | timestamp | Last `archive:download` run |
| `last_populate_at` | timestamp | Last `archive:populate` run |
| `archivedotorg_track_match` | Track matching results | Schema Patch |
| `archivedotorg_unmatched_track` | Failed track matches | Schema Patch |
| `archivedotorg_daily_metrics` | Aggregated dashboard metrics | Schema Patch |
| `archivedotorg_cache` | General caching | Schema Patch |

**List all custom tables:**
```sql
SHOW TABLES LIKE 'archivedotorg%';
```

## Custom Product Attributes

| Attribute | Type | Purpose |
|-----------|------|---------|
| `archive_downloads` | int | Download count |
| `archive_avg_rating` | decimal | Average rating |
| `show_date` | varchar | Performance date |
| `show_venue` | varchar | Venue name |
| `title` | varchar | Track/show title |
| `source` | text | Recording source/lineage |
| `runtime` | varchar | Track duration |

## Custom Category Attributes

| Attribute | Type | Purpose |
|-----------|------|---------|
| `band_extended_bio` | text | Wikipedia biography |
| `band_origin_location` | varchar | City/country |
| `band_years_active` | varchar | Active years |
| `band_total_shows` | int | Total recordings |
| `band_most_played_track` | varchar | Most played song |
| `band_genres` | varchar | Musical genres |

## Index Management

```bash
# Check index status
bin/magento indexer:status

# Reindex all
bin/magento indexer:reindex

# Reindex specific
bin/magento indexer:reindex catalog_category_product
bin/magento indexer:reindex catalog_product_price
bin/magento indexer:reindex catalogsearch_fulltext

# Reset index (marks as invalid)
bin/magento indexer:reset catalog_category_product

# Set indexer mode
bin/magento indexer:set-mode realtime   # Update on save
bin/magento indexer:set-mode schedule   # Update via cron

# Fix store-specific index (CRITICAL after imports!)
bin/fix-index
```

## Database Migrations

### Adding New Tables

1. Define in `db_schema.xml`:
```xml
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <table name="archivedotorg_my_table" resource="default" engine="innodb">
        <column xsi:type="int" name="entity_id" identity="true" nullable="false"/>
        <column xsi:type="varchar" name="name" length="255" nullable="false"/>
        <column xsi:type="timestamp" name="created_at" default="CURRENT_TIMESTAMP"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>
        <index referenceId="IDX_NAME" indexType="btree">
            <column name="name"/>
        </index>
    </table>
</schema>
```

2. Generate whitelist:
```bash
bin/magento setup:db-declaration:generate-whitelist --module-name=ArchiveDotOrg_Core
```

3. Run migration:
```bash
bin/magento setup:upgrade
```

### Adding Columns
```xml
<!-- Add to existing table in db_schema.xml -->
<table name="archivedotorg_activity_log">
    <column xsi:type="varchar" name="new_column" length="255" nullable="true"/>
</table>
```

### Adding Indexes
```xml
<index referenceId="IDX_ARTIST_DATE" indexType="btree">
    <column name="artist_name"/>
    <column name="created_at"/>
</index>
```

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| GraphQL returns 0 products | Missing store index | `bin/fix-index` |
| Index is "invalid" | Needs reindex | `bin/magento indexer:reindex` |
| Index is "processing" | Stuck reindex | Reset then reindex |
| Slow queries | Missing index | Add index to table |
| Attribute not found | Wrong attribute_id | Use dynamic lookup |
| Lock wait timeout | Concurrent imports | Wait or kill process |

### Query Debugging
```sql
-- Show query execution plan
EXPLAIN SELECT ... FROM catalog_category_product_index WHERE category_id = 1510;

-- Show table indexes
SHOW INDEX FROM catalog_category_product_index_store1;

-- Analyze table for optimizer
ANALYZE TABLE catalog_category_product_index_store1;

-- Check for locked tables
SHOW PROCESSLIST;

-- Check table sizes
SELECT
  table_name,
  ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb,
  table_rows
FROM information_schema.tables
WHERE table_schema = 'magento'
ORDER BY (data_length + index_length) DESC
LIMIT 20;
```

### Slow Query Analysis
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Check slow queries
-- In container: tail -f /var/log/mysql/slow-query.log
```

### Reset Test Data
```sql
-- Delete products from specific category
DELETE p FROM catalog_product_entity p
JOIN catalog_category_product cp ON p.entity_id = cp.product_id
WHERE cp.category_id = 1510;

-- Truncate index tables (use with caution!)
TRUNCATE TABLE catalog_category_product;
TRUNCATE TABLE catalog_category_product_index;
TRUNCATE TABLE catalog_category_product_index_store1;

-- Then reindex
-- bin/magento indexer:reindex
-- bin/fix-index
```

## Production Deployment

### Pre-Deployment Backup
```bash
# Full database backup
bin/mysqldump --single-transaction > backup-$(date +%s).sql

# Specific tables only
bin/mysqldump magento archivedotorg_activity_log archivedotorg_studio_albums > tables-backup.sql

# Verify backup
bin/mysqldump magento --no-data | grep "CREATE TABLE"
```

### Schema Upgrade Procedure
```bash
# 1. Backup database
bin/mysqldump magento > backup.sql

# 2. Enable maintenance mode
bin/magento maintenance:enable

# 3. Run schema upgrade
bin/magento setup:upgrade

# 5. Clear cache
bin/magento cache:flush

# 6. Reindex
bin/magento indexer:reindex
bin/fix-index

# 7. Disable maintenance
bin/magento maintenance:disable
```

### Rollback Procedure
```bash
# Restore from backup
bin/mysql < backup.sql

# Verify tables
bin/magento module:status

# Reindex
bin/magento indexer:reindex
bin/fix-index

# Clear cache
bin/magento cache:flush
```

### Performance Tuning
```sql
-- Increase connection pool (in db.env or my.cnf)
max_connections = 500

-- Configure InnoDB for large tables (50-75% of RAM)
innodb_buffer_pool_size = 4G

-- Monitor connection usage
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

### Multi-Store Considerations

If you have multiple stores, indexes are per-store:
- `catalog_category_product_index_store1` (store 1)
- `catalog_category_product_index_store2` (store 2)
- etc.

The `bin/fix-index` script currently handles store 1 only. For multi-store:
```sql
-- Check all store-specific indexes
SHOW TABLES LIKE 'catalog_category_product_index_store%';

-- Populate each store's index
INSERT IGNORE INTO catalog_category_product_index_store2 ...
```

## Critical Files

| File | Purpose |
|------|---------|
| `bin/fix-index` | Fix store-specific index |
| `bin/mysql` | MySQL CLI access |
| `bin/mysqldump` | Database backup |
| `Core/etc/db_schema.xml` | Table definitions |
| `Core/Model/BulkProductImporter.php` | Direct SQL for performance |
| `env/db.env` | Database credentials |

## Reference

See main `CLAUDE.md` for:
- Full Docker setup
- Import pipeline
- Magento CLI commands
