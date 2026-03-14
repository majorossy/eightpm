// RecordingMetaBlock — full stacked metadata block (date, venue, location, taper, badges)
// Drop-in replacement for the 4-row metadata pattern repeated across 9+ components.

import type { Song } from '@/lib/types';
import DateDisplay from '../atoms/DateDisplay';
import VenueDisplay from '../atoms/VenueDisplay';
import TaperDisplay from '../atoms/TaperDisplay';
import RecTypeBadge from '../atoms/RecTypeBadge';
import StarRating from '../atoms/StarRating';
import DownloadCount from '../atoms/DownloadCount';
import VersionsPill from '../atoms/VersionsPill';

export type RecordingMetaBlockSize = 'sm' | 'md' | 'lg' | 'xl';

interface MetaBlockSizeConfig {
  textSm: string;
  textXs: string;
  taperIconSize: number;
  downloadIconSize: number;
  containerGap: string;
  dateVenueGap: string;
  badgeRowGap: string;
}

const SIZE_CONFIG: Record<RecordingMetaBlockSize, MetaBlockSizeConfig> = {
  sm:  { textSm: 'text-[10px]', textXs: 'text-[9px]',  taperIconSize: 14, downloadIconSize: 9,  containerGap: 'gap-px',  dateVenueGap: 'gap-0.5', badgeRowGap: 'gap-1'   },
  md:  { textSm: 'text-[13px]', textXs: 'text-[11px]', taperIconSize: 16, downloadIconSize: 12, containerGap: 'gap-px',  dateVenueGap: 'gap-1',   badgeRowGap: 'gap-1.5' },
  lg:  { textSm: 'text-[14px]', textXs: 'text-[12px]', taperIconSize: 18, downloadIconSize: 15, containerGap: 'gap-1',   dateVenueGap: 'gap-1.5', badgeRowGap: 'gap-2'   },
  xl:  { textSm: 'text-[16px]', textXs: 'text-[14px]', taperIconSize: 20, downloadIconSize: 16, containerGap: 'gap-1',   dateVenueGap: 'gap-2',   badgeRowGap: 'gap-2.5' },
};

interface RecordingMetaBlockConfig {
  venueAsLink?: boolean;
  venueTruncateLength?: number;
  taperLinkToArchive?: boolean;
  taperIconSize?: number;
  downloadFormat?: 'full' | 'compact';
  downloadIconSize?: number;
  showLocation?: boolean;
  showTaper?: boolean;
  showDownloads?: boolean;
  size?: RecordingMetaBlockSize;
  showBadges?: boolean;
  layout?: 'vertical' | 'horizontal';
}

interface RecordingMetaBlockProps {
  song: Song;
  config?: RecordingMetaBlockConfig;
  versionCount?: number;
  onVersionsClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function RecordingMetaBlock({
  song,
  config = {},
  versionCount,
  onVersionsClick,
  className = '',
}: RecordingMetaBlockProps) {
  const {
    venueAsLink = true,
    venueTruncateLength,
    taperLinkToArchive = false,
    taperIconSize: taperIconSizeOverride,
    downloadFormat = 'full',
    downloadIconSize: downloadIconSizeOverride,
    showLocation = true,
    showTaper = true,
    showDownloads = true,
    size = 'md',
    showBadges = true,
    layout = 'vertical',
  } = config;

  const cfg = SIZE_CONFIG[size];
  const taperIconSize = taperIconSizeOverride ?? cfg.taperIconSize;
  const downloadIconSize = downloadIconSizeOverride ?? cfg.downloadIconSize;
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    // Horizontal: all metadata in a single inline flow with · separators
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        {/* Date + Venue inline */}
        {(song.showDate || song.showVenue || song.albumName) && (
          <>
            <DateDisplay date={song.showDate} className={`font-jb-mono ${cfg.textXs} font-semibold text-primary leading-tight tracking-wide flex-shrink-0`} />
            <VenueDisplay
              venue={song.showVenue}
              albumName={song.albumName}
              asLink={venueAsLink}
              truncateLength={venueTruncateLength ?? 20}
              className={`${cfg.textXs} truncate`}
              normalizedName={song.venueNormalizedName}
              venueSlug={song.venueSlug}
            />
          </>
        )}
        {/* Taper inline (with separator) */}
        {showTaper && song.taper && (
          <>
            <span className={`${cfg.textXs} flex-shrink-0`} style={{ color: 'var(--text-subdued)' }}>·</span>
            <TaperDisplay
              taper={song.taper}
              iconSize={taperIconSize}
              fontSize={cfg.textXs}
              linkToArchive={taperLinkToArchive}
            />
          </>
        )}
        {/* Badges inline (with separator) */}
        {showBadges && (
          <>
            <span className={`${cfg.textXs} flex-shrink-0`} style={{ color: 'var(--text-subdued)' }}>·</span>
            <div className={`flex items-center ${cfg.badgeRowGap} flex-shrink-0`}>
              <RecTypeBadge type={song.recordingType} />
              <StarRating rating={song.avgRating} count={song.numReviews} identifier={song.albumIdentifier} />
              {showDownloads && (
                <DownloadCount downloads={song.downloads} format={downloadFormat} iconSize={downloadIconSize} identifier={song.albumIdentifier} />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${cfg.containerGap} ${className}`}>
      {/* Row 1: Date + Venue */}
      {(song.showDate || song.showVenue || song.albumName) && (
        <div className={`flex items-baseline ${cfg.dateVenueGap}`}>
          <DateDisplay date={song.showDate} className={`font-jb-mono ${cfg.textSm} font-semibold text-primary leading-tight tracking-wide flex-shrink-0`} />
          <VenueDisplay
            venue={song.showVenue}
            albumName={song.albumName}
            asLink={venueAsLink}
            truncateLength={venueTruncateLength}
            className={cfg.textSm}
            normalizedName={song.venueNormalizedName}
            venueSlug={song.venueSlug}
          />
        </div>
      )}

      {/* Row 2: Location */}
      {showLocation && song.showLocation && (
        <span className={`font-mono ${cfg.textXs}`} style={{ color: 'var(--text-tertiary)' }}>
          {song.showLocation}
        </span>
      )}

      {/* Row 3: Taper */}
      {showTaper && (
        <TaperDisplay
          taper={song.taper}
          iconSize={taperIconSize}
          fontSize={cfg.textXs}
          linkToArchive={taperLinkToArchive}
        />
      )}

      {/* Row 4: Source badge + Stars + Downloads + Versions */}
      {showBadges && (
        <div className={`flex items-center ${cfg.badgeRowGap}`}>
          <RecTypeBadge type={song.recordingType} />
          <StarRating rating={song.avgRating} count={song.numReviews} identifier={song.albumIdentifier} />
          {showDownloads && (
            <DownloadCount downloads={song.downloads} format={downloadFormat} iconSize={downloadIconSize} identifier={song.albumIdentifier} />
          )}
          {versionCount != null && versionCount > 1 && (
            <span className="ml-auto">
              <VersionsPill
                count={versionCount}
                variant={onVersionsClick ? 'button' : 'pill'}
                onClick={onVersionsClick}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
