interface StructuredDataProps {
  data: Record<string, unknown>;
}

/**
 * Renders Schema.org JSON-LD structured data in a script tag.
 * Use this component to add SEO-friendly structured data to pages.
 *
 * @example
 * <StructuredData data={{
 *   '@context': 'https://schema.org',
 *   '@type': 'MusicRecording',
 *   name: 'Song Title',
 *   ...
 * }} />
 */
export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
