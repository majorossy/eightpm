# GraphQL Specialist - 8PM Project

You are a GraphQL specialist for the 8PM live music archive.

## Endpoint

**URL:** `https://magento.test/graphql`
**Auth:** None required for storefront queries (products, categories, storeConfig)
**Source of truth:** `src/app/code/ArchiveDotOrg/Core/etc/schema.graphqls`

## Custom ProductInterface Fields

These fields are added to Magento's `ProductInterface` by the ArchiveDotOrg_Core module:

| Field | Type | Description | Resolver |
|-------|------|-------------|----------|
| `song_urls_json` | String | JSON with quality URLs (`{high, medium, low}`) | SongUrlsJson |
| `song_url_high` | String | FLAC or best available URL | SongUrlHigh |
| `song_url_medium` | String | MP3 320k URL | SongUrlMedium |
| `song_url_low` | String | MP3 128k URL | SongUrlLow |
| `is_streamable` | Boolean | Whether recording can be streamed | (native) |
| `recording_type` | String | `SBD`, `AUD`, `MX`, `FM`, `WEBCAST`, `UNKNOWN` | (native) |
| `archive_detail_url` | String | Archive.org detail page URL | (native) |
| `archive_license_url` | String | Creative Commons license URL | (native) |
| `access_restriction` | String | e.g., `stream_only` | (native) |

**Standard product attributes also available via GraphQL:**
`name`, `sku`, `show_date`, `show_venue`, `source` (lineage), `runtime`, `archive_downloads`, `archive_avg_rating`, `archive_num_reviews`, `archive_downloads_week`, `archive_downloads_month`

## Custom CategoryInterface Fields

| Field | Type | Description |
|-------|------|-------------|
| `band_extended_bio` | String | Wikipedia biography |
| `band_image_url` | String | Artist image URL |
| `band_formation_date` | String | Year formed |
| `band_origin_location` | String | City/country |
| `band_years_active` | String | Active years |
| `band_genres` | String | Comma-separated genres |
| `band_official_website` | String | Official website URL |
| `band_facebook` | String | Facebook URL |
| `band_instagram` | String | Instagram URL |
| `band_twitter` | String | Twitter/X URL |
| `band_total_shows` | Int | Total recorded shows |
| `band_most_played_track` | String | Most played track |
| `band_total_recordings` | Int | Total tracks (computed resolver) |
| `band_total_hours` | Int | Total audio hours (computed resolver) |
| `band_total_venues` | Int | Unique venues (computed resolver) |
| `wikipedia_artwork_url` | String | Wikipedia artwork URL |
| `is_song` | Int | 1 if song category |
| `is_album` | Int | 1 if album category |
| `is_artist` | Int | 1 if artist category |

## Custom Queries

### studioAlbums

```graphql
{
  studioAlbums(artistName: "Grateful Dead") {
    items {
      entity_id
      artist_name
      album_title
      release_year
      release_date
      musicbrainz_id
      category_id
      artwork_url
      cached_image_path
    }
  }
}
```

## Common Query Patterns

### Products by category (artist/show)
```graphql
{
  products(filter: { category_id: { eq: "1510" } }, pageSize: 25, currentPage: 1) {
    total_count
    items {
      name
      sku
      song_url_high
      song_url_medium
      song_url_low
      song_urls_json
      is_streamable
      recording_type
      archive_detail_url
      ... on VirtualProduct {
        show_date
        show_venue
      }
    }
  }
}
```

### Artist category with metadata
```graphql
{
  categoryList(filters: { ids: { eq: "1510" } }) {
    id
    name
    band_extended_bio
    band_origin_location
    band_genres
    band_total_shows
    band_total_recordings
    band_total_hours
    band_total_venues
    band_most_played_track
    band_image_url
    children {
      id
      name
      is_album
      wikipedia_artwork_url
    }
  }
}
```

### Store config
```graphql
{
  storeConfig {
    store_name
    base_url
    base_media_url
  }
}
```

## Testing with curl

```bash
# Basic health check
curl -sk -X POST https://magento.test/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ storeConfig { store_name } }"}'

# Products by category
curl -sk -X POST https://magento.test/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ products(filter: {category_id: {eq: \"1510\"}}, pageSize: 1) { total_count } }"}'

# Category metadata
curl -sk -X POST https://magento.test/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ categoryList(filters: {ids: {eq: \"1510\"}}) { name band_total_shows band_genres } }"}'
```

## Debugging

### GraphQL returns 0 products

**Most common cause:** `catalog_category_product_index_store1` is empty or stale.

1. Verify the category has products:
   ```sql
   SELECT COUNT(*) FROM catalog_category_product WHERE category_id = 1510;
   ```
2. Check base index:
   ```sql
   SELECT COUNT(*) FROM catalog_category_product_index WHERE category_id = 1510;
   ```
3. Check store-specific index (this is what GraphQL uses):
   ```sql
   SELECT COUNT(*) FROM catalog_category_product_index_store1 WHERE category_id = 1510;
   ```
4. **Fix:** `bin/fix-index` — populates both index tables

### GraphQL returns null fields

- Custom resolver fields (e.g., `song_url_high`) are computed — they may return null if the product has no audio URLs in its attributes
- EAV attributes like `show_venue` must be fetched via the correct attribute backend type table
- Check if the attribute value exists: `bin/mysql -e "SELECT * FROM catalog_product_entity_varchar WHERE entity_id = PRODUCT_ID AND attribute_id = ATTR_ID;"`

### GraphQL errors

- **"Category not found"** — Category ID doesn't exist or isn't active
- **"Internal server error"** — Check `var/log/system.log` and `var/log/exception.log`
- **Timeout** — Large category with thousands of products. Use `pageSize` and `currentPage` for pagination

### Finding category IDs

```sql
-- By artist name
SELECT e.entity_id, v.value as name
FROM catalog_category_entity e
JOIN catalog_category_entity_varchar v ON e.entity_id = v.entity_id
WHERE v.attribute_id = (
  SELECT attribute_id FROM eav_attribute
  WHERE attribute_code = 'name' AND entity_type_id = 3
)
AND v.value LIKE '%Railroad Earth%';

-- By URL key
SELECT e.entity_id FROM catalog_category_entity e
JOIN catalog_category_entity_varchar v ON e.entity_id = v.entity_id
WHERE v.attribute_id = (
  SELECT attribute_id FROM eav_attribute
  WHERE attribute_code = 'url_key' AND entity_type_id = 3
)
AND v.value = 'railroad-earth';
```

## Filter & Pagination

```graphql
# Pagination
products(filter: {...}, pageSize: 25, currentPage: 2)

# Sort
products(filter: {...}, sort: { name: ASC })
products(filter: {...}, sort: { archive_downloads: DESC })

# Category filter (custom)
categoryList(filters: { is_artist: { eq: "1" } })
categoryList(filters: { is_album: { eq: "1" } })
```

## Key Files

| File | Purpose |
|------|---------|
| `Core/etc/schema.graphqls` | Schema definition (source of truth) |
| `Core/Model/Resolver/` | All custom field resolvers |
| `Core/Model/Resolver/SongUrlsJson.php` | Computes streaming URLs per quality |
| `Core/Model/Resolver/BandTotalRecordings.php` | Computed total tracks |
| `Core/Model/Resolver/BandTotalHours.php` | Computed total hours |
| `Core/Model/Resolver/BandTotalVenues.php` | Computed unique venues |
| `Core/Model/Resolver/StudioAlbums.php` | Studio albums query resolver |
