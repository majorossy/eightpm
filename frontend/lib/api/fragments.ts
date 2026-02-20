// Shared GraphQL query fragments for product fields
// Used by GET_SONGS_BY_CATEGORY_QUERY, GET_SONGS_BY_SEARCH_QUERY, and GET_ALL_SONGS_QUERY

export const PRODUCT_FIELDS_FRAGMENT = `
  uid
  sku
  name
  song_title
  song_duration
  song_url
  song_url_high
  song_url_medium
  song_url_low
  show_name
  identifier
  show_venue
  show_location
  show_taper
  show_source
  lineage
  notes
  archive_avg_rating
  archive_num_reviews
  archive_downloads
  archive_downloads_week
  archive_downloads_month
  is_streamable
  recording_type
  archive_detail_url
  archive_license_url
  access_restriction
  show_runtime
  show_added_date
  show_public_date
  show_subject
  track_original_file
  track_album
  categories {
    uid
    name
    url_key
  }
`;

export const GET_SONGS_BY_CATEGORY_QUERY = `
  query GetSongsByCategory($categoryUid: String!, $pageSize: Int!) {
    products(filter: { category_uid: { eq: $categoryUid } }, pageSize: $pageSize) {
      items {
        ${PRODUCT_FIELDS_FRAGMENT}
      }
      total_count
    }
  }
`;

export const GET_SONGS_BY_SEARCH_QUERY = `
  query GetSongsBySearch($search: String!, $pageSize: Int!) {
    products(search: $search, pageSize: $pageSize) {
      items {
        ${PRODUCT_FIELDS_FRAGMENT}
      }
      total_count
    }
  }
`;

export const GET_ALL_SONGS_QUERY = `
  query GetAllSongs($pageSize: Int!) {
    products(search: "", pageSize: $pageSize) {
      items {
        ${PRODUCT_FIELDS_FRAGMENT}
      }
      total_count
    }
  }
`;

// GET_SONG_BY_ID_QUERY has a different field set (no show_runtime, show_added_date, etc.)
export const GET_SONG_BY_ID_QUERY = `
  query GetSongById($uid: String!) {
    products(filter: { uid: { eq: $uid } }) {
      items {
        uid
        sku
        name
        song_title
        song_duration
        song_url
        song_url_high
        song_url_medium
        song_url_low
        show_name
        identifier
        show_venue
        show_location
        show_taper
        show_source
        lineage
        notes
        archive_avg_rating
        archive_num_reviews
        archive_downloads
        archive_downloads_week
        archive_downloads_month
        is_streamable
        recording_type
        archive_detail_url
        archive_license_url
        access_restriction
        categories {
          uid
          name
          url_key
        }
      }
    }
  }
`;
