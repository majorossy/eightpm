/** Title-case a venue name, preserving common abbreviations and small words. */
const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'de', 'du', 'le', 'la']);
const UPPER_WORDS = new Set(['bbq', 'uno', 'nyc', 'dc', 'la', 'ii', 'iii', 'iv', 'dj']);

export function titleCaseVenue(name: string): string {
  // Already mixed-case (has uppercase beyond first char) — leave as-is
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name;

  return name
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (UPPER_WORDS.has(lower)) return word.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
