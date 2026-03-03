// Cassette - a saved version selection for a single album (show)
// Lightweight: stores album reference + version overrides only.
// At render time, the track list is resolved by fetching the album
// and applying overrides (falling back to getBestVersion for defaults).

export interface Cassette {
  id: string;                                    // "cassette-{timestamp}"
  name: string;                                  // Auto-generated or user-named
  albumIdentifier: string;                       // Archive.org identifier
  artistSlug: string;
  artistName: string;
  albumName: string;
  coverArt?: string;
  showDate?: string;
  showVenue?: string;
  showLocation?: string;
  versionOverrides: Record<string, string>;      // trackId → songId (non-default picks only)
  createdAt: string;
  updatedAt: string;
}
