# GraphQL Schema Expansion - Complete Archive.org Product Attributes

**Date:** 2026-02-07
**Status:** ✅ Complete - All product attributes now exposed in GraphQL

## Summary

Previously, only ~16 Archive.org product attributes were exposed in GraphQL. This update adds **ALL 38 Archive.org product attributes** to the GraphQL schema, making every piece of imported metadata accessible to the frontend.

## What Was Added

### Previously Exposed (16 fields)
- `song_urls_json`, `song_url_high`, `song_url_medium`, `song_url_low`
- `is_streamable`, `recording_type`
- `archive_detail_url`, `archive_license_url`, `access_restriction`
- `show_runtime`, `show_added_date`, `show_public_date`, `show_subject`
- `track_original_file`, `track_album`

### Newly Exposed (22 fields)

| Field | Type | Description |
|-------|------|-------------|
| **Identifiers & URLs** |
| `identifier` | String | Archive.org show identifier (e.g., gd1977-05-08.sbd.miller.32601) |
| `guid` | String | Global unique identifier |
| `song_url` | String | Legacy single song URL |
| **Show Metadata** |
| `show_name` | String | Show/album name |
| `show_date` | String | Performance date (YYYY-MM-DD) |
| `show_year` | String | Performance year |
| `show_venue` | String | Venue name |
| `show_location` | String | **Venue city/state (e.g., "Morrison, CO")** |
| `show_pub_date` | String | Publication date on Archive.org |
| **Recording Source** |
| `show_taper` | String | Who recorded the show |
| `show_transferer` | String | Who transferred/digitized it |
| `lineage` | String | Recording chain (equipment, process) |
| `notes` | String | Show notes, setlist, guests, covers |
| **Track Info** |
| `title` | String | Track title |
| `length` | String | Track duration |
| **Server/Storage** |
| `dir` | String | Directory path on Archive.org |
| `server_one` | String | Primary server URL |
| `server_two` | String | Secondary server URL |
| **Statistics** |
| `archive_avg_rating` | String | Average rating (1-5 stars) |
| `archive_num_reviews` | Int | Number of reviews |
| `archive_downloads` | Int | Total downloads |
| `archive_downloads_week` | Int | Downloads this week |
| `archive_downloads_month` | Int | Downloads this month |
| **Collection** |
| `archive_collection` | String | Collection/artist name |

## Key Improvements

### 1. City/State Location Now Available ✅
The `show_location` field exposes city/state data (e.g., "Port Chester, NY", "Morrison, CO") that was being imported from Archive.org's `coverage` field but wasn't accessible to the frontend.

**Impact:** Recording cards can now show venue + location in the header:
```
Red Rocks Amphitheatre
Morrison, CO
```

### 2. Complete Recording Metadata
All recording source information is now available:
- **Taper:** Who recorded it
- **Transferer:** Who digitized it
- **Lineage:** Full recording chain
- **Notes:** Setlist, guests, special performances

### 3. Archive.org Statistics
All download and rating stats are exposed:
- Total downloads + trending (week/month)
- Average rating + review count
- Great for "Popular Recordings" features

### 4. Complete Show Context
Frontend now has access to:
- Show dates, years, venues
- Show identifiers for deep-linking
- Publication dates for sorting

## Schema Organization

The ProductInterface schema is now organized into logical sections:

```graphql
interface ProductInterface {
    # Audio streaming URLs
    song_urls_json, song_url_high, song_url_medium, song_url_low, song_url

    # Recording metadata
    is_streamable, recording_type, access_restriction

    # Archive.org identifiers and URLs
    identifier, archive_detail_url, archive_license_url, guid

    # Show metadata
    show_name, show_date, show_year, show_venue, show_location,
    show_runtime, show_pub_date, show_added_date, show_public_date, show_subject

    # Recording source metadata
    show_taper, show_transferer, lineage, notes

    # Track metadata
    title, length, track_original_file, track_album

    # Archive.org server/storage
    dir, server_one, server_two

    # Archive.org statistics
    archive_avg_rating, archive_num_reviews, archive_downloads,
    archive_downloads_week, archive_downloads_month

    # Collection/artist
    archive_collection
}
```

## Files Modified

| File | Changes |
|------|---------|
| `src/app/code/ArchiveDotOrg/Core/etc/schema.graphqls` | Added 22 new product attributes with descriptions and comments |

## Testing

### Test Query
```graphql
query {
  products(
    filter: { archive_collection: { eq: "Railroad Earth" } }
    pageSize: 1
  ) {
    items {
      sku
      name
      # New fields
      show_venue
      show_location
      show_date
      show_year
      show_taper
      lineage
      notes
      archive_avg_rating
      archive_num_reviews
      archive_downloads
    }
  }
}
```

### Expected Result
```json
{
  "data": {
    "products": {
      "items": [
        {
          "sku": "archive-abc123...",
          "name": "Railroad Earth - Bird in a House",
          "show_venue": "Red Rocks Amphitheatre",
          "show_location": "Morrison, CO",
          "show_date": "2018-02-17",
          "show_year": "2018",
          "show_taper": "John Smith",
          "lineage": "Schoeps MK4>KC5>CMC6>Edirol R-44...",
          "notes": "Setlist: Bird in a House > ...",
          "archive_avg_rating": "4.5",
          "archive_num_reviews": 12,
          "archive_downloads": 1523
        }
      ]
    }
  }
}
```

## Frontend Impact

The frontend already expects many of these fields (like `show_location`, `show_venue`, `show_date`, `notes`, `lineage`, etc.) but they were returning `null`. They should now populate with actual data.

### Affected Components
- **AlbumPageContent.tsx** - Recording cards will now show city/state
- **VenueLink.tsx** - Already handles venue names
- **Track metadata displays** - Can now show taper, lineage, notes
- **Statistics displays** - Can show download counts, ratings

## Cache Clearing

After making schema changes:
```bash
docker exec -u app 8pm-phpfpm-1 bin/magento cache:flush
```

Or use:
```bash
bin/rs cache-flush
```

## Next Steps

1. ✅ Schema updated
2. ✅ Cache cleared
3. ⏳ Test frontend to verify data is appearing
4. ⏳ Consider adding these fields to GraphQL queries if needed
5. ⏳ Update TypeScript types if any fields were missing

## Notes

- All fields are optional (String/Int, not String!/Int!)
- No custom resolvers needed - Magento handles EAV attributes automatically
- Frontend can safely query any of these fields without errors
- Empty fields return `null` (not errors)
