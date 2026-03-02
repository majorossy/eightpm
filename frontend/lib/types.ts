// Types aligned with Magento 2 GraphQL schema
// Song = Product, Artist = Category, Queue = Cart, Favorites = Wishlist
// Hierarchy: Artist -> Album -> Track -> Song (recordings)

export type AudioQuality = 'high' | 'medium' | 'low';

export interface Song {
  id: string;                    // Magento product uid
  sku: string;                   // Magento product sku
  title: string;                 // product.name
  artistId: string;              // category id
  artistName: string;            // category name
  artistSlug: string;            // category url_key
  duration: number;              // custom attribute: duration (seconds)
  streamUrl: string;             // custom attribute: stream_url (legacy fallback)
  albumArt: string;              // product.image.url
  price?: number;                // product.price_range.minimum_price.final_price.value
  // Multi-quality support
  qualityUrls?: {
    high?: string;
    medium?: string;
    low?: string;
  };
  defaultQuality?: AudioQuality;
  // Album/track context
  albumIdentifier: string;       // Archive.org identifier (links to Album)
  albumName: string;             // show_name
  trackTitle: string;            // Normalized track name (song_title)
  showDate?: string;             // Performance date (parsed from show_name)
  showVenue?: string;            // Venue name (Archive.org: venue)
  showLocation?: string;         // City/state (Archive.org: coverage)
  // Recording metadata
  taper?: string;                // Who recorded it (Archive.org: taper)
  source?: string;               // Recording equipment (Archive.org: source)
  lineage?: string;              // Recording chain/transfer info (Archive.org: lineage)
  notes?: string;                // Performance notes, guests, covers
  // Archive.org ratings
  avgRating?: number;            // 1-5 star average from Archive.org reviews
  numReviews?: number;           // Total review count on Archive.org
  // Archive.org download stats
  downloads?: number;            // Total download count
  downloadsWeek?: number;        // Downloads this week
  downloadsMonth?: number;       // Downloads this month
  // Availability & recording type (copyright restrictions)
  isStreamable?: boolean;        // Whether the track can be streamed (false = restricted)
  archiveDetailUrl?: string;     // Direct link to Archive.org detail page
  archiveLicenseUrl?: string;    // Creative Commons license URL
  recordingType?: string;        // 'SBD' | 'AUD' | 'MX' | 'FM' | 'WEBCAST' | 'UNKNOWN'
  accessRestriction?: string;    // Restriction reason (e.g., 'stream_only', 'no_derive')
  // New show-level metadata (duplicated on every track)
  showRuntime?: string;          // Total show duration (e.g., "2:31:31")
  showAddedDate?: string;        // When uploaded to Archive.org (ISO datetime)
  showPublicDate?: string;       // When made public on Archive.org (ISO datetime)
  showSubject?: string;          // Genre/event tags (e.g., "americana; newgrass; Horn O'Plenty 2017")
  // New track-level metadata
  trackOriginalFile?: string;    // Original source file for derivatives (links MP3 back to FLAC)
  trackAlbum?: string;           // Album name from file metadata
  // Lineage-parsed recording equipment
  recordingMedium?: string;
  microphoneModel?: string;
  recorderDevice?: string;
  preampModel?: string;
  adConverter?: string;
  editingSoftware?: string;
  finalFormat?: string;
}

// Track - a unique song title within an album (may have multiple recordings)
export interface Track {
  id: string;                    // Generated: `${albumIdentifier}-${trackSlug}`
  title: string;                 // song_title
  slug: string;                  // URL-safe version of title
  albumIdentifier: string;       // Parent album identifier
  albumName: string;             // Parent album name
  artistId: string;
  artistName: string;
  artistSlug: string;
  songs: Song[];                 // Different recordings of this track
  totalDuration: number;         // Duration of first/primary recording
  songCount: number;             // Number of recordings
}

// Track child - lightweight category-level track info (for discography cards)
export interface AlbumTrackChild {
  id: string;
  name: string;
  slug: string;
  versionCount: number;
}

// Album - a show/concert grouped by Archive.org identifier
export interface Album {
  id: string;                    // The `identifier` attribute
  identifier: string;            // Archive.org identifier
  name: string;                  // show_name
  slug: string;                  // URL-safe identifier
  artistId: string;
  artistName: string;
  artistSlug: string;
  showDate?: string;             // Performance date
  showVenue?: string;            // Venue name
  showLocation?: string;         // City/state location
  description?: string;          // Archive.org description/notes
  tracks: Track[];               // Tracks in this album
  totalTracks: number;           // Number of unique tracks
  totalSongs: number;            // Total recordings across all tracks
  totalDuration: number;         // Sum of all song durations
  coverArt?: string;             // Album cover image
  wikipediaArtworkUrl?: string;  // Wikipedia album artwork URL
  releaseYear?: number;          // Studio album release year (from Wikipedia)
  trackCount?: number;           // Number of unique tracks on the studio album
  trackChildren?: AlbumTrackChild[]; // Lightweight track children from category tree
}

export interface Artist {
  id: string;                    // Magento category uid
  name: string;                  // category.name
  slug: string;                  // category.url_key
  image: string;                 // category.image
  bio: string;                   // custom attribute: description
  songCount?: number;            // product_count (total recordings)
  albumCount?: number;           // Number of albums
  // Extended artist metadata
  formationDate?: string;        // Year or date band was formed
  originLocation?: string;       // City/state/country of origin
  yearsActive?: string;          // e.g., "1965-1995, 2002-present"
  extendedBio?: string;          // Longer biography from external sources
  bandImageUrl?: string;         // Wikipedia/Wikimedia band photo (hotlinked)
  genres?: string[];             // Musical genres
  officialWebsite?: string;      // Official website URL
  youtubeChannel?: string;       // YouTube channel URL
  facebook?: string;             // Facebook page URL
  instagram?: string;            // Instagram handle/URL
  twitter?: string;              // Twitter handle/URL
  totalShows?: number;           // Total number of shows/albums
  mostPlayedTrack?: string;      // Most popular track name
  totalRecordings?: number;      // Total number of recordings/tracks
  totalHours?: number;           // Total hours of audio content
  totalVenues?: number;          // Total unique venues played
  formationYear?: number;        // Formation year (parsed from formationDate)
}

// Band member information
export interface BandMember {
  name: string;                  // Member name
  role: string;                  // Instrument/position
  years: string;                 // Years active with band
  image?: string;                // Member photo URL
  bio?: string;                  // Brief biography
}

// Image attribution from Wikimedia Commons
export interface ImageAttribution {
  artist: string;
  license: string;
  licenseUrl: string;
}

// Wikipedia summary data
export interface WikipediaSummary {
  title: string;                 // Wikipedia page title
  extract: string;               // Text extract from Wikipedia
  description: string | null;    // Short description
  thumbnail: {                   // Thumbnail image data
    source: string;
    width: number;
    height: number;
  } | null;
  url: string | null;            // Wikipedia page URL
  extendedBio?: string;          // 3-5 paragraphs from TextExtracts API
  thumbnailAttribution?: ImageAttribution | null;  // Wikimedia Commons metadata
}

// Band member and career data
export interface BandMemberData {
  slug: string;                  // Artist slug
  name: string;                  // Band name
  biography?: string;            // Extended biography text (2-5 paragraphs)
  members: {
    current: BandMember[];       // Current members
    former: BandMember[];        // Former members
  };
  careerHighlights?: string[];   // Notable achievements
  recordingStats?: {             // Recording statistics
    totalShows: number;
    yearsActive: string;
    mostRecordedVenue?: string;
  };
  socialLinks?: {                // Social media links
    website?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  images?: Array<{               // Band photos/images
    url: string;
    caption?: string;
    credit?: string;
  }>;
}

export interface ArtistDetail extends Artist {
  albums: Album[];               // Albums (shows) by this artist
  songs: Song[];                 // Flat list of all songs (for backwards compat)
  wikipediaSummary?: WikipediaSummary | null; // Wikipedia extract and metadata
  bandData?: BandMemberData | null; // Band members and career data
}

// Podcast types - aligned with category attributes
export interface Podcast {
  id: string;                    // Magento category uid
  name: string;                  // category.name
  slug: string;                  // category.url_key
  image: string;                 // category.image
  description: string;           // category.description
  episodeCount?: number;         // product_count (total episodes)
  // Podcast-specific attributes
  isPodcast: boolean;            // is_podcast (always true for podcasts)
  spotifyUrl?: string;           // podcast_spotify_url
  appleUrl?: string;             // podcast_apple_url
  youtubeUrl?: string;           // podcast_youtube_url
  rssFeed?: string;              // podcast_rss_feed
}

export interface PodcastEpisode extends Song {
  // Podcast episodes are products, so they inherit all Song properties
  // Additional podcast-specific properties can be added here
  episodeNumber?: number;        // Derived from title or custom attribute
  publishDate?: string;          // Use showDate or custom attribute
}

export interface PodcastDetail extends Podcast {
  episodes: PodcastEpisode[];    // Episodes in this podcast
}

// Cart types (Queue)
export interface CartItem {
  id: string;                    // cart item uid
  song: Song;
  quantity: number;              // always 1 for songs
}

export interface Cart {
  id: string;                    // cart id
  items: CartItem[];
  itemCount: number;
}

// Wishlist types (Favorites)
export interface WishlistItem {
  id: string;                    // wishlist item id
  song: Song;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  items: WishlistItem[];
  itemCount: number;
}

// Customer (for wishlist - requires auth)
export interface Customer {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
}

// Magento Customer Authentication Types
export interface MagentoCustomer {
  id?: number;
  email: string;
  firstname: string;
  lastname: string;
  addresses?: MagentoCustomerAddress[];
}

export interface MagentoCustomerAddress {
  id: number;
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region: { region: string; region_code: string; region_id: number };
  postcode: string;
  country_code: string;
  telephone: string;
  default_billing: boolean;
  default_shipping: boolean;
}

export interface MagentoAuthTokenResponse {
  generateCustomerToken: {
    token: string;
  };
}

export interface MagentoCustomerCreateInput {
  email: string;
  firstname: string;
  lastname: string;
  password: string;
}

// Venue types - aligned with backend GraphQL schema

export interface VenueDetail {
  venue_id: number;
  slug: string;
  normalized_name: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  total_shows: number;
  total_artists: number;
  total_tracks: number;
  first_show_date?: string;
  last_show_date?: string;
}

export interface VenueShow {
  identifier: string;
  name: string;
  show_date?: string;
  artist_name: string;
  artist_slug: string;
  track_count: number;
  recording_types?: string[];
}

export interface VenueArtist {
  name: string;
  slug: string;
  show_count: number;
}

export interface ArtistVenueCount {
  venue_name: string;
  venue_slug: string;
  recording_count: number;
  city?: string;
  state?: string;
}
