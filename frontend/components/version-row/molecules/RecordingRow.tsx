// RecordingRow — unified recording data display used by all 10+ locations.
// Optionally renders inline action buttons (play, swap, like, queue, playlist)
// when the `actions` prop is provided.

import type { Song } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import RecordingMediumIcon from '@/components/RecordingMediumIcon';
import RecordingMetaBlock from './RecordingMetaBlock';
import type { RecordingMetaBlockSize } from './RecordingMetaBlock';
import RecordingRowActions from '../atoms/RecordingRowActions';
import type { RecordingAction } from '../atoms/RecordingRowActions';

export type RecordingRowSize = 'sm' | 'md' | 'lg' | 'xl';
export type { RecordingAction };

interface RowSizeConfig {
  trackNum: string;
  title: string;
  duration: string;
  iconScale: number;
  containerGap: string;
  iconRowGap: string;
  titleRowGap: string;
  titleRowMb: string;
  actionGap: string;
}

const SIZE_CONFIG: Record<RecordingRowSize, RowSizeConfig> = {
  sm:  { trackNum: 'text-[9px]',  title: 'text-[11px]',   duration: 'text-[9px]',  iconScale: 0.55, containerGap: 'gap-px', iconRowGap: 'gap-2',   titleRowGap: 'gap-1',   titleRowMb: 'mb-0.5', actionGap: 'gap-2' },
  md:  { trackNum: 'text-[11px]', title: 'text-[13.5px]', duration: 'text-[11px]', iconScale: 0.7,  containerGap: 'gap-px', iconRowGap: 'gap-3',   titleRowGap: 'gap-1.5', titleRowMb: 'mb-1',   actionGap: 'gap-3' },
  lg:  { trackNum: 'text-[13px]', title: 'text-[16px]',   duration: 'text-[13px]', iconScale: 0.85, containerGap: 'gap-1',  iconRowGap: 'gap-3.5', titleRowGap: 'gap-2',   titleRowMb: 'mb-1',   actionGap: 'gap-3' },
  xl:  { trackNum: 'text-[15px]', title: 'text-[18px]',   duration: 'text-[15px]', iconScale: 1.0,  containerGap: 'gap-1',  iconRowGap: 'gap-4',   titleRowGap: 'gap-2',   titleRowMb: 'mb-1.5', actionGap: 'gap-4' },
};

export interface RecordingRowProps {
  song: Song;
  size?: RecordingRowSize;
  trackNumber?: number | null;
  showTitle?: boolean;
  showDuration?: boolean;
  showMediumIcon?: boolean;
  showLocation?: boolean;
  showTaper?: boolean;
  showBadges?: boolean;
  showDownloads?: boolean;
  taperLinkToArchive?: boolean;
  downloadFormat?: 'full' | 'compact';
  versionCount?: number;
  onVersionsClick?: (e: React.MouseEvent) => void;
  isPlaying?: boolean;
  className?: string;
  // Override icon scale (defaults to SIZE_CONFIG value for the chosen size)
  iconScale?: number;
  // Align action buttons to the start instead of the end
  actionsAlign?: 'start' | 'end';
  // Action buttons (optional — when omitted, layout unchanged)
  actions?: RecordingAction[];
  swapLabel?: string;
  swapHighlighted?: boolean;
  onSwap?: (e: React.MouseEvent) => void;
  onPlay?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  isCurrentlyPlaying?: boolean;
  onActionHover?: (hovered: boolean) => void;
  availableVersions?: Song[];
}

export default function RecordingRow({
  song,
  size = 'md',
  trackNumber,
  showTitle = true,
  showDuration = true,
  showMediumIcon = true,
  showLocation = true,
  showTaper = true,
  showBadges = true,
  showDownloads = true,
  taperLinkToArchive = false,
  downloadFormat = 'full',
  versionCount,
  onVersionsClick,
  isPlaying,
  className = '',
  actions,
  onSwap,
  onPlay,
  iconScale: iconScaleOverride,
  actionsAlign = 'end',
  swapLabel,
  swapHighlighted,
  onAddToQueue,
  isCurrentlyPlaying,
  onActionHover,
  availableVersions,
}: RecordingRowProps) {
  const cfg = SIZE_CONFIG[size];
  const metaSize: RecordingMetaBlockSize = size;
  const hasActions = actions && actions.length > 0;

  const content = (
    <div className={`flex flex-col ${cfg.containerGap} ${hasActions ? '' : className}`}>
      {/* Row 1: [#] Title ........... [Duration] */}
      {showTitle && (
        <div className={`flex items-baseline ${cfg.titleRowGap} ${cfg.titleRowMb}`}>
          {trackNumber != null && (
            <span className={`font-jb-mono ${cfg.trackNum} font-medium flex-shrink-0`} style={{ color: 'var(--text-tertiary)' }}>
              {trackNumber}
            </span>
          )}
          <span className={`${cfg.title} font-serif font-semibold text-primary truncate`} style={{ lineHeight: '1.3' }}>
            {song.title}
          </span>
          {showDuration && song.duration > 0 && (
            <span className={`font-jb-mono ${cfg.duration} font-medium flex-shrink-0 ml-auto`} style={{ color: 'var(--text-tertiary)' }}>
              {formatDuration(song.duration)}
            </span>
          )}
        </div>
      )}

      {/* Row 2+: [MediumIcon] RecordingMetaBlock */}
      <div className={`flex ${cfg.iconRowGap}`}>
        {showMediumIcon && (
          <div className="flex-shrink-0 pt-0.5">
            <RecordingMediumIcon
              medium={song.recordingMedium}
              lineage={song.lineage}
              source={song.source}
              size={iconScaleOverride ?? cfg.iconScale}
              isPlaying={isPlaying}
            />
          </div>
        )}
        <RecordingMetaBlock
          song={song}
          config={{
            size: metaSize,
            showLocation,
            showTaper,
            showBadges,
            showDownloads,
            taperLinkToArchive,
            downloadFormat,
          }}
          versionCount={versionCount}
          onVersionsClick={onVersionsClick}
          className="min-w-0"
        />
      </div>
    </div>
  );

  // No actions → render data-only (backwards compatible)
  if (!hasActions) return content;

  // With actions → stack vertically: content on top, actions below
  return (
    <div className={`flex flex-col ${cfg.containerGap} ${className}`}>
      {content}
      <div className={`flex ${actionsAlign === 'start' ? 'justify-start' : 'justify-end'}`}>
        <RecordingRowActions
          song={song}
          actions={actions}
          size={size}
          isCurrentlyPlaying={isCurrentlyPlaying}
          swapLabel={swapLabel}
          swapHighlighted={swapHighlighted}
          onSwap={onSwap}
          onPlay={onPlay}
          onAddToQueue={onAddToQueue}
          onActionHover={onActionHover}
          availableVersions={availableVersions}
        />
      </div>
    </div>
  );
}
