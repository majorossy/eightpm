/**
 * Input validation utilities for frontend security
 * Prevents DoS attacks, injection, and invalid data
 */

// ============================================
// Constants
// ============================================

export const VALIDATION_LIMITS = {
  // Search inputs
  SEARCH_QUERY_MAX: 200,
  SEARCH_QUERY_MIN: 1,

  // Identifiers (UIDs, slugs, etc.)
  UID_MAX: 100,
  SLUG_MAX: 200,
  PLAYLIST_ID_MAX: 50,

  // Form fields
  NAME_MAX: 100,
  NAME_MIN: 2,
  EMAIL_MAX: 254, // RFC 5321 max
  MESSAGE_MAX: 5000,
  MESSAGE_MIN: 10,
  PLAYLIST_NAME_MAX: 100,
  PLAYLIST_NAME_MIN: 1,
  PLAYLIST_DESCRIPTION_MAX: 500,
  MINIDISC_NAME_MAX: 100,
  MINIDISC_NAME_MIN: 1,
  MINIDISC_DESCRIPTION_MAX: 500,
  CASSETTE_NAME_MAX: 100,
  CASSETTE_NAME_MIN: 1,
  VENUE_MAX: 200,

  // Numeric ranges
  YEAR_MIN: 1900,
  YEAR_MAX: 2100,
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 100,
} as const;

// ============================================
// Validation Functions
// ============================================

/**
 * Validates search query input
 * @returns Error message if invalid, undefined if valid
 */
export function validateSearchQuery(query: string): string | undefined {
  if (!query || query.trim().length === 0) {
    return 'Search query is required';
  }
  if (query.length > VALIDATION_LIMITS.SEARCH_QUERY_MAX) {
    return `Search query too long (max ${VALIDATION_LIMITS.SEARCH_QUERY_MAX} characters)`;
  }
  return undefined;
}

/**
 * Validates a UID/identifier (e.g., track UID)
 * @returns Error message if invalid, undefined if valid
 */
export function validateUid(uid: string): string | undefined {
  if (!uid || uid.trim().length === 0) {
    return 'ID is required';
  }
  if (uid.length > VALIDATION_LIMITS.UID_MAX) {
    return 'Invalid ID format';
  }
  // UIDs should only contain safe characters
  // Allow alphanumeric, hyphens, underscores, colons (for base64)
  if (!/^[a-zA-Z0-9_\-:=+/]+$/.test(uid)) {
    return 'Invalid ID format';
  }
  return undefined;
}

/**
 * Validates a URL slug (artist, album, track slugs)
 * @returns Error message if invalid, undefined if valid
 */
export function validateSlug(slug: string): string | undefined {
  if (!slug || slug.trim().length === 0) {
    return 'Slug is required';
  }
  if (slug.length > VALIDATION_LIMITS.SLUG_MAX) {
    return 'Invalid slug format';
  }
  // Slugs should only contain URL-safe characters
  // Allow lowercase alphanumeric, hyphens, underscores, and numbers
  if (!/^[a-z0-9_\-]+$/i.test(slug)) {
    return 'Invalid slug format';
  }
  return undefined;
}

/**
 * Validates an email address
 * @returns Error message if invalid, undefined if valid
 */
export function validateEmail(email: string): string | undefined {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }
  if (email.length > VALIDATION_LIMITS.EMAIL_MAX) {
    return 'Email address too long';
  }
  // Basic email regex - not perfect but catches most issues
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
}

/**
 * Validates a name field
 * @returns Error message if invalid, undefined if valid
 */
export function validateName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.trim().length < VALIDATION_LIMITS.NAME_MIN) {
    return `Name must be at least ${VALIDATION_LIMITS.NAME_MIN} characters`;
  }
  if (name.length > VALIDATION_LIMITS.NAME_MAX) {
    return `Name must be less than ${VALIDATION_LIMITS.NAME_MAX} characters`;
  }
  return undefined;
}

/**
 * Validates a message/text field
 * @returns Error message if invalid, undefined if valid
 */
export function validateMessage(message: string): string | undefined {
  if (!message || message.trim().length === 0) {
    return 'Message is required';
  }
  if (message.trim().length < VALIDATION_LIMITS.MESSAGE_MIN) {
    return `Message must be at least ${VALIDATION_LIMITS.MESSAGE_MIN} characters`;
  }
  if (message.length > VALIDATION_LIMITS.MESSAGE_MAX) {
    return `Message must be less than ${VALIDATION_LIMITS.MESSAGE_MAX} characters`;
  }
  return undefined;
}

/**
 * Validates a playlist name
 * @returns Error message if invalid, undefined if valid
 */
export function validatePlaylistName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return 'Playlist name is required';
  }
  if (name.length > VALIDATION_LIMITS.PLAYLIST_NAME_MAX) {
    return `Playlist name must be less than ${VALIDATION_LIMITS.PLAYLIST_NAME_MAX} characters`;
  }
  return undefined;
}

/**
 * Validates a playlist description
 * @returns Error message if invalid, undefined if valid
 */
export function validatePlaylistDescription(description: string): string | undefined {
  if (description.length > VALIDATION_LIMITS.PLAYLIST_DESCRIPTION_MAX) {
    return `Description must be less than ${VALIDATION_LIMITS.PLAYLIST_DESCRIPTION_MAX} characters`;
  }
  return undefined;
}

/**
 * Validates a playlist ID
 * @returns Error message if invalid, undefined if valid
 */
export function validatePlaylistId(id: string): string | undefined {
  if (!id || id.trim().length === 0) {
    return 'Playlist ID is required';
  }
  if (id.length > VALIDATION_LIMITS.PLAYLIST_ID_MAX) {
    return 'Invalid playlist ID';
  }
  // Playlist IDs should only contain safe characters
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    return 'Invalid playlist ID format';
  }
  return undefined;
}

/**
 * Validates a year value
 * @returns Error message if invalid, undefined if valid
 */
export function validateYear(year: number | string): string | undefined {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (isNaN(yearNum)) {
    return 'Invalid year format';
  }
  if (yearNum < VALIDATION_LIMITS.YEAR_MIN || yearNum > VALIDATION_LIMITS.YEAR_MAX) {
    return `Year must be between ${VALIDATION_LIMITS.YEAR_MIN} and ${VALIDATION_LIMITS.YEAR_MAX}`;
  }
  return undefined;
}

/**
 * Validates a page size value for pagination
 * @returns Error message if invalid, undefined if valid
 */
export function validatePageSize(size: number | string): string | undefined {
  const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size;
  if (isNaN(sizeNum)) {
    return 'Invalid page size';
  }
  if (sizeNum < VALIDATION_LIMITS.PAGE_SIZE_MIN || sizeNum > VALIDATION_LIMITS.PAGE_SIZE_MAX) {
    return `Page size must be between ${VALIDATION_LIMITS.PAGE_SIZE_MIN} and ${VALIDATION_LIMITS.PAGE_SIZE_MAX}`;
  }
  return undefined;
}

/**
 * Validates a venue name
 * @returns Error message if invalid, undefined if valid
 */
export function validateVenue(venue: string): string | undefined {
  if (venue.length > VALIDATION_LIMITS.VENUE_MAX) {
    return `Venue must be less than ${VALIDATION_LIMITS.VENUE_MAX} characters`;
  }
  return undefined;
}

// ============================================
// Sanitization Functions
// ============================================

/**
 * Sanitizes input for display (prevents XSS)
 * Note: React already escapes output, this is for extra safety
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Truncates a string to a maximum length with ellipsis
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.slice(0, maxLength - 3) + '...';
}

/**
 * Clamps a numeric string to a valid integer within bounds
 */
export function clampNumericInput(
  input: string,
  min: number,
  max: number,
  defaultValue: number
): number {
  const parsed = parseInt(input, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return Math.min(Math.max(parsed, min), max);
}
