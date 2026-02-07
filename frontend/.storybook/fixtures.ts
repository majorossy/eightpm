import type {
  Song, Track, Album, Artist, ArtistDetail,
  BandMember, BandMemberData, WikipediaSummary, ImageAttribution,
  VenueDetail, VenueShow, VenueArtist, ArtistVenueCount,
  WishlistItem, Wishlist,
} from '../lib/types';
import type { QueueItem, QueueItemAlbumSource } from '../lib/queueTypes';

// =============================================================================
// Songs
// =============================================================================

export const mockSong: Song = {
  id: 'song-1',
  sku: 'rre-2024-01-01-track1',
  title: 'Bird in a House',
  trackTitle: 'Bird in a House',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  duration: 342,
  streamUrl: '',
  albumArt: '/images/default-album.jpg',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  showDate: '2024-01-01',
  showVenue: 'Red Rocks Amphitheatre',
  showLocation: 'Morrison, CO',
  recordingType: 'SBD',
  avgRating: 4.5,
  numReviews: 12,
  downloads: 1234,
};

export const mockSong2: Song = {
  id: 'song-2',
  sku: 'rre-2024-01-01-track2',
  title: 'Elko',
  trackTitle: 'Elko',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  duration: 487,
  streamUrl: '',
  albumArt: '/images/default-album.jpg',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  showDate: '2024-01-01',
  showVenue: 'Red Rocks Amphitheatre',
  showLocation: 'Morrison, CO',
  recordingType: 'SBD',
  avgRating: 4.8,
  numReviews: 8,
  downloads: 987,
};

export const mockSong3: Song = {
  id: 'song-3',
  sku: 'rre-2024-01-01-track3',
  title: 'Warhead Boogie',
  trackTitle: 'Warhead Boogie',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  duration: 556,
  streamUrl: '',
  albumArt: '/images/default-album.jpg',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  showDate: '2024-01-01',
  showVenue: 'Red Rocks Amphitheatre',
  showLocation: 'Morrison, CO',
  recordingType: 'AUD',
  avgRating: 4.2,
  numReviews: 5,
  downloads: 654,
};

export const mockSongRestricted: Song = {
  ...mockSong,
  id: 'song-restricted',
  isStreamable: false,
  accessRestriction: 'stream_only',
  archiveDetailUrl: 'https://archive.org/details/example',
};

// =============================================================================
// Tracks
// =============================================================================

export const mockTrack: Track = {
  id: 'track-1',
  title: 'Bird in a House',
  slug: 'bird-in-a-house',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  songs: [mockSong],
  totalDuration: 342,
  songCount: 1,
};

export const mockTrack2: Track = {
  id: 'track-2',
  title: 'Elko',
  slug: 'elko',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  songs: [mockSong2],
  totalDuration: 487,
  songCount: 1,
};

export const mockTrack3: Track = {
  id: 'track-3',
  title: 'Warhead Boogie',
  slug: 'warhead-boogie',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  songs: [mockSong3],
  totalDuration: 556,
  songCount: 1,
};

// =============================================================================
// Albums
// =============================================================================

export const mockAlbum: Album = {
  id: 'RailroadEarth2024-01-01',
  identifier: 'RailroadEarth2024-01-01',
  name: 'Railroad Earth Live at Red Rocks',
  slug: 'railroadearth2024-01-01',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  showDate: '2024-01-01',
  showVenue: 'Red Rocks Amphitheatre',
  showLocation: 'Morrison, CO',
  tracks: [mockTrack, mockTrack2, mockTrack3],
  totalTracks: 8,
  totalSongs: 12,
  totalDuration: 4520,
  coverArt: '/images/default-album.jpg',
};

export const mockAlbum2: Album = {
  id: 'RailroadEarth2023-07-15',
  identifier: 'RailroadEarth2023-07-15',
  name: 'Railroad Earth Live at The Capitol Theatre',
  slug: 'railroadearth2023-07-15',
  artistId: 'cat-rre',
  artistName: 'Railroad Earth',
  artistSlug: 'railroadearth',
  showDate: '2023-07-15',
  showVenue: 'The Capitol Theatre',
  showLocation: 'Port Chester, NY',
  tracks: [mockTrack],
  totalTracks: 10,
  totalSongs: 10,
  totalDuration: 5400,
  coverArt: '/images/default-album.jpg',
};

export const mockAlbums: Album[] = [mockAlbum, mockAlbum2];

// =============================================================================
// Artists
// =============================================================================

export const mockArtist: Artist = {
  id: 'cat-rre',
  name: 'Railroad Earth',
  slug: 'railroadearth',
  image: '/images/default-artist.jpg',
  bio: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001.',
  songCount: 955,
  albumCount: 120,
  originLocation: 'Stillwater, New Jersey',
  yearsActive: '2001-present',
  formationDate: '2001',
  genres: ['Jam Band', 'Bluegrass', 'Americana'],
  officialWebsite: 'https://railroadearth.com',
  facebook: 'https://facebook.com/railroadearth',
  instagram: 'https://instagram.com/railroadearth',
  twitter: 'https://twitter.com/railroadearth',
  totalShows: 120,
  mostPlayedTrack: 'Bird in a House',
  totalRecordings: 955,
  totalHours: 520,
  totalVenues: 85,
  formationYear: 2001,
};

export const mockArtist2: Artist = {
  id: 'cat-gd',
  name: 'Grateful Dead',
  slug: 'gratefuldead',
  image: '/images/default-artist.jpg',
  bio: 'The Grateful Dead was an American rock band formed in 1965 in Palo Alto, California.',
  songCount: 14000,
  albumCount: 1861,
};

// =============================================================================
// Band Members & Data
// =============================================================================

export const mockBandMembers: BandMember[] = [
  { name: 'Todd Sheaffer', role: 'Vocals, Guitar', years: '2001-present' },
  { name: 'Tim Carbone', role: 'Violin, Vocals', years: '2001-present' },
  { name: 'John Skehan', role: 'Mandolin, Piano', years: '2001-present' },
  { name: 'Andy Goessling', role: 'Multi-instrumentalist', years: '2001-2018' },
  { name: 'Carey Harmon', role: 'Drums', years: '2001-present' },
  { name: 'Andrew Altman', role: 'Bass', years: '2003-present' },
];

export const mockFormerMembers: BandMember[] = [
  { name: 'Andy Goessling', role: 'Multi-instrumentalist', years: '2001-2018' },
  { name: 'Dave Von Dollen', role: 'Bass', years: '2001-2003' },
];

export const mockBandData: BandMemberData = {
  slug: 'railroadearth',
  name: 'Railroad Earth',
  biography: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001 by singer-songwriter Todd Sheaffer after the breakup of From Good Homes. The band blends elements of bluegrass, folk, rock, country, jazz, and Celtic music into a unique sound they describe as "a mixture of Appalachian folk and bluegrass with electric rock."',
  members: {
    current: mockBandMembers.filter(m => m.years.includes('present')),
    former: mockFormerMembers,
  },
  careerHighlights: [
    'Performed at Bonnaroo, Telluride Bluegrass Festival, and countless other festivals',
    'Released 7 studio albums including "Bird in a House" (2002)',
    'Known for extended live jams and improvisational performances',
  ],
  recordingStats: {
    totalShows: 120,
    yearsActive: '2001-present',
    mostRecordedVenue: 'Red Rocks Amphitheatre',
  },
  socialLinks: {
    website: 'https://railroadearth.com',
    youtube: 'https://youtube.com/railroadearth',
    facebook: 'https://facebook.com/railroadearth',
    instagram: 'https://instagram.com/railroadearth',
    twitter: 'https://twitter.com/railroadearth',
  },
};

export const mockWikipediaSummary: WikipediaSummary = {
  title: 'Railroad Earth',
  extract: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001.',
  description: 'American jam band',
  thumbnail: {
    source: '/images/default-artist.jpg',
    width: 300,
    height: 400,
  },
  url: 'https://en.wikipedia.org/wiki/Railroad_Earth',
  extendedBio: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001 by singer-songwriter Todd Sheaffer. The band blends bluegrass, folk, rock, country, jazz, and Celtic music.',
  thumbnailAttribution: {
    artist: 'Concert Photographer',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
};

export const mockImageAttribution: ImageAttribution = {
  artist: 'Concert Photographer',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

export const mockArtistDetail: ArtistDetail = {
  ...mockArtist,
  albums: mockAlbums,
  songs: [mockSong, mockSong2, mockSong3],
  wikipediaSummary: mockWikipediaSummary,
  bandData: mockBandData,
};

// =============================================================================
// Venues
// =============================================================================

export const mockVenue: VenueDetail = {
  venue_id: 1,
  slug: 'red-rocks-amphitheatre',
  normalized_name: 'Red Rocks Amphitheatre',
  city: 'Morrison',
  state: 'CO',
  country: 'US',
  latitude: 39.6654,
  longitude: -105.2057,
  total_shows: 45,
  total_artists: 12,
  total_tracks: 520,
  first_show_date: '2001-08-15',
  last_show_date: '2024-09-21',
};

export const mockVenue2: VenueDetail = {
  venue_id: 2,
  slug: 'the-capitol-theatre',
  normalized_name: 'The Capitol Theatre',
  city: 'Port Chester',
  state: 'NY',
  country: 'US',
  latitude: 41.0018,
  longitude: -73.6654,
  total_shows: 32,
  total_artists: 18,
  total_tracks: 380,
  first_show_date: '2012-09-15',
  last_show_date: '2024-11-10',
};

export const mockVenue3: VenueDetail = {
  venue_id: 3,
  slug: 'madison-square-garden',
  normalized_name: 'Madison Square Garden',
  city: 'New York',
  state: 'NY',
  country: 'US',
  latitude: 40.7505,
  longitude: -73.9934,
  total_shows: 85,
  total_artists: 25,
  total_tracks: 950,
  first_show_date: '1970-02-11',
  last_show_date: '2024-12-31',
};

export const mockVenues: VenueDetail[] = [mockVenue, mockVenue2, mockVenue3];

export const mockVenueShows: VenueShow[] = [
  {
    identifier: 'RailroadEarth2024-01-01',
    name: 'Railroad Earth Live at Red Rocks',
    show_date: '2024-01-01',
    artist_name: 'Railroad Earth',
    artist_slug: 'railroadearth',
    track_count: 12,
    recording_types: ['SBD'],
  },
  {
    identifier: 'GratefulDead1978-05-08',
    name: 'Grateful Dead Live at Red Rocks',
    show_date: '1978-05-08',
    artist_name: 'Grateful Dead',
    artist_slug: 'gratefuldead',
    track_count: 18,
    recording_types: ['SBD', 'AUD'],
  },
  {
    identifier: 'Phish2023-09-01',
    name: 'Phish Live at Red Rocks',
    show_date: '2023-09-01',
    artist_name: 'Phish',
    artist_slug: 'phish',
    track_count: 22,
    recording_types: ['AUD'],
  },
];

export const mockVenueArtists: VenueArtist[] = [
  { name: 'Railroad Earth', slug: 'railroadearth', show_count: 15 },
  { name: 'Grateful Dead', slug: 'gratefuldead', show_count: 12 },
  { name: 'Phish', slug: 'phish', show_count: 8 },
  { name: 'String Cheese Incident', slug: 'thestringcheeseincident', show_count: 6 },
  { name: 'Widespread Panic', slug: 'widespreadpanic', show_count: 5 },
];

export const mockArtistVenues: ArtistVenueCount[] = [
  { venue_name: 'Red Rocks Amphitheatre', venue_slug: 'red-rocks-amphitheatre', recording_count: 15, city: 'Morrison', state: 'CO' },
  { venue_name: 'The Capitol Theatre', venue_slug: 'the-capitol-theatre', recording_count: 12, city: 'Port Chester', state: 'NY' },
  { venue_name: 'Madison Square Garden', venue_slug: 'madison-square-garden', recording_count: 8, city: 'New York', state: 'NY' },
  { venue_name: 'The Fillmore', venue_slug: 'the-fillmore', recording_count: 7, city: 'San Francisco', state: 'CA' },
  { venue_name: 'Telluride Town Park', venue_slug: 'telluride-town-park', recording_count: 6, city: 'Telluride', state: 'CO' },
];

// =============================================================================
// Queue Items
// =============================================================================

const mockAlbumSource: QueueItemAlbumSource = {
  albumId: 'RailroadEarth2024-01-01',
  albumIdentifier: 'RailroadEarth2024-01-01',
  albumName: 'Railroad Earth Live at Red Rocks',
  artistSlug: 'railroadearth',
  artistName: 'Railroad Earth',
  coverArt: '/images/default-album.jpg',
  showDate: '2024-01-01',
  showVenue: 'Red Rocks Amphitheatre',
  showLocation: 'Morrison, CO',
  originalTrackIndex: 0,
};

export const mockQueueItem: QueueItem = {
  queueId: 'q-1',
  batchId: 'batch-1',
  song: mockSong,
  trackTitle: 'Bird in a House',
  trackSlug: 'bird-in-a-house',
  availableVersions: [mockSong],
  albumSource: mockAlbumSource,
  played: false,
  source: { type: 'album-load' },
};

export const mockQueueItem2: QueueItem = {
  queueId: 'q-2',
  batchId: 'batch-1',
  song: mockSong2,
  trackTitle: 'Elko',
  trackSlug: 'elko',
  availableVersions: [mockSong2],
  albumSource: { ...mockAlbumSource, originalTrackIndex: 1 },
  played: false,
  source: { type: 'album-load' },
};

export const mockQueueItem3: QueueItem = {
  queueId: 'q-3',
  batchId: 'batch-1',
  song: mockSong3,
  trackTitle: 'Warhead Boogie',
  trackSlug: 'warhead-boogie',
  availableVersions: [mockSong3],
  albumSource: { ...mockAlbumSource, originalTrackIndex: 2 },
  played: true,
  source: { type: 'album-load' },
};

export const mockQueueItems: QueueItem[] = [mockQueueItem, mockQueueItem2, mockQueueItem3];

// =============================================================================
// Wishlist
// =============================================================================

export const mockWishlistItem: WishlistItem = {
  id: 'wl-1',
  song: mockSong,
  addedAt: '2024-01-15T10:30:00Z',
};

export const mockWishlist: Wishlist = {
  id: 'wishlist-1',
  items: [
    mockWishlistItem,
    { id: 'wl-2', song: mockSong2, addedAt: '2024-01-16T14:00:00Z' },
  ],
  itemCount: 2,
};
