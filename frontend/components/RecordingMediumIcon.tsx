'use client';

import { getMediumFromLineage, getMediumLabel, type RecordingMedium } from '@/lib/mediumUtils';
import {
  ReelToReelIcon, CassetteIcon, MicrocassetteIcon,
  DATIcon, MiniDiscIcon, CDRIcon,
  FlashRecorderIcon, SDCardIcon,
  BandcampIcon, UnknownIcon,
} from '@/components/media-icons';

interface Props {
  medium?: string;       // from backend attribute (preferred)
  lineage?: string;      // fallback: parse client-side
  source?: string;       // fallback: parse client-side
  size?: number;         // scale factor (default: 1)
  className?: string;
  isPlaying?: boolean;   // animate icon when track is active
}

const ICON_MAP: Record<string, React.ComponentType<{size?: number; className?: string; isPlaying?: boolean}>> = {
  cassette: CassetteIcon,
  dat: DATIcon,
  minidisc: MiniDiscIcon,
  microcassette: MicrocassetteIcon,
  reel_to_reel: ReelToReelIcon,
  cd: CDRIcon,
  sd_card: SDCardIcon,
  compact_flash: SDCardIcon,    // Same icon for SD/CF
  flash_recorder: FlashRecorderIcon,
  bandcamp: BandcampIcon,
};

export default function RecordingMediumIcon({ medium, lineage, source, size = 1, className, isPlaying }: Props) {
  const detected: RecordingMedium = (medium as RecordingMedium) || getMediumFromLineage(lineage, source);
  const Icon = detected ? ICON_MAP[detected] : UnknownIcon;
  const FinalIcon = Icon || UnknownIcon;
  const label = getMediumLabel(detected);
  return (
    <div title={label} className={className}>
      <FinalIcon size={size} isPlaying={isPlaying} />
    </div>
  );
}
