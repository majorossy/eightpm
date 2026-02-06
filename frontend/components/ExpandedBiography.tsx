'use client';

import Link from 'next/link';

interface ExpandedBiographyProps {
  artistName: string;
  extendedBio?: string;
  wikipediaExtract?: string;
  wikipediaUrl?: string | null;
  totalShows?: number;
  yearsActive?: string;
  genres?: string[];
  originLocation?: string;
  formationDate?: string;
}

/**
 * ExpandedBiography - SEO-optimized biography section
 *
 * Purpose: Expand artist bios to 300+ words for better SEO
 * SEO Benefits:
 * - Longer content increases dwell time
 * - Keyword-rich supplementary content
 * - Natural keyword placement for long-tail searches
 */
export default function ExpandedBiography({
  artistName,
  extendedBio,
  wikipediaExtract,
  wikipediaUrl,
  totalShows,
  yearsActive,
  genres,
  originLocation,
  formationDate,
}: ExpandedBiographyProps) {
  // Calculate if bio is short (less than 300 words)
  const bioText = extendedBio || wikipediaExtract || '';
  const wordCount = bioText.split(/\s+/).filter(Boolean).length;
  const needsExpansion = wordCount < 300;

  // Generate supplementary SEO content
  const generateSupplementaryContent = () => {
    const parts: string[] = [];

    // Archive.org collection info
    if (totalShows && totalShows > 0) {
      parts.push(
        `Explore ${totalShows.toLocaleString()} live ${artistName} recordings in the 8pm.me archive. ` +
        `Each concert captures the unique energy and improvisational spirit that makes ${artistName} performances legendary.`
      );
    }

    // Years active and formation context
    if (yearsActive || formationDate) {
      const yearInfo = yearsActive ? `spanning ${yearsActive}` : (formationDate ? `since ${formationDate}` : '');
      if (yearInfo) {
        parts.push(
          `With a career ${yearInfo}, ${artistName} has developed a devoted following among fans of live music and ` +
          `improvisational performances. The band's evolution over the years is documented through these carefully preserved recordings.`
        );
      }
    }

    // Genre context for keyword targeting
    if (genres && genres.length > 0) {
      const genreList = genres.slice(0, 4).join(', ');
      parts.push(
        `${artistName}'s sound draws from ${genreList}, blending these influences into extended improvisational jams ` +
        `that make each live performance a unique experience.`
      );
    }

    // Origin location for local SEO
    if (originLocation) {
      parts.push(
        `Hailing from ${originLocation}, ${artistName} has become a cornerstone of the live music community, ` +
        `known for performances that reward repeated listening.`
      );
    }

    // Call to action
    parts.push(
      `Stream ${artistName} concerts for free on 8pm.me, featuring high-quality recordings from Archive.org. ` +
      `No subscription required - dive into the complete archive of live performances and discover why fans return to these recordings again and again.`
    );

    return parts;
  };

  const supplementaryParagraphs = needsExpansion ? generateSupplementaryContent() : [];

  return (
    <div className="space-y-4">
      {/* Extended bio from Wikipedia (3-5 paragraphs) - prioritized over short extract */}
      {extendedBio ? (
        <div className="space-y-4">
          {extendedBio.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
            <p
              key={index}
              className="text-[#8a8478] text-sm md:text-base leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
          {/* Wikipedia attribution */}
          <div className="flex items-center gap-2 mt-3 text-xs text-[#6a6458]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801.111-.947-.122-.149-.389-.17-.94-.185l-.255-.003c-.089-.003-.134-.034-.134-.093v-.509l.06-.038c.919-.003 3.097-.003 3.097-.003l.059.045v.436c0 .119-.075.176-.225.176-.564.037-1.143.106-1.434.627-.315.596-1.727 3.468-1.727 3.468l-.136.028 2.405 5.055.143.046 3.503-7.602c.23-.542.282-.845.282-1.016 0-.327-.188-.487-.617-.517l-.428-.03c-.089-.003-.134-.034-.134-.093v-.509l.06-.038c.919-.003 3.097-.003 3.097-.003l.059.045v.436c0 .119-.075.176-.225.176-.994.037-1.374.249-1.915 1.427l-4.401 9.263c-.63 1.34-1.064 2.248-1.707 3.066-.595.758-1.239 1.136-1.913 1.136-.717 0-1.236-.509-1.568-1.014l-.157-.277"/>
            </svg>
            <span>Content from Wikipedia</span>
            <span>·</span>
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a060] hover:underline"
            >
              CC BY-SA 3.0
            </a>
            {wikipediaUrl && (
              <>
                <span>·</span>
                <a
                  href={wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a060] hover:underline"
                >
                  Read more
                </a>
              </>
            )}
          </div>
        </div>
      ) : wikipediaExtract ? (
        /* Fallback to short Wikipedia extract if no extended bio */
        <div className="text-[#8a8478] text-sm md:text-base leading-relaxed">
          <p>{wikipediaExtract}</p>
          {/* Wikipedia attribution */}
          <div className="flex items-center gap-2 mt-3 text-xs text-[#6a6458]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801.111-.947-.122-.149-.389-.17-.94-.185l-.255-.003c-.089-.003-.134-.034-.134-.093v-.509l.06-.038c.919-.003 3.097-.003 3.097-.003l.059.045v.436c0 .119-.075.176-.225.176-.564.037-1.143.106-1.434.627-.315.596-1.727 3.468-1.727 3.468l-.136.028 2.405 5.055.143.046 3.503-7.602c.23-.542.282-.845.282-1.016 0-.327-.188-.487-.617-.517l-.428-.03c-.089-.003-.134-.034-.134-.093v-.509l.06-.038c.919-.003 3.097-.003 3.097-.003l.059.045v.436c0 .119-.075.176-.225.176-.994.037-1.374.249-1.915 1.427l-4.401 9.263c-.63 1.34-1.064 2.248-1.707 3.066-.595.758-1.239 1.136-1.913 1.136-.717 0-1.236-.509-1.568-1.014l-.157-.277"/>
            </svg>
            <span>Content from Wikipedia</span>
            <span>·</span>
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a060] hover:underline"
            >
              CC BY-SA 3.0
            </a>
            {wikipediaUrl && (
              <>
                <span>·</span>
                <a
                  href={wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a060] hover:underline"
                >
                  Read more
                </a>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Supplementary SEO content - only shown if bio is short */}
      {needsExpansion && supplementaryParagraphs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#3a3632]/30">
          <h3 className="text-sm font-semibold text-[#a8a098] mb-3">
            About {artistName} on 8pm.me
          </h3>
          {supplementaryParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-[#8a8478] text-sm leading-relaxed mb-3 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Browse all shows CTA */}
      {totalShows && totalShows > 0 && (
        <div className="mt-4 pt-4 border-t border-[#3a3632]/30">
          <p className="text-sm text-[#6a6458]">
            Browse all {totalShows.toLocaleString()} {artistName} live recordings in the archive above.
          </p>
        </div>
      )}
    </div>
  );
}
