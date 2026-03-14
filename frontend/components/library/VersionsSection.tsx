'use client';

import { useMemo } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { usePlayer } from '@/context/PlayerContext';
import { aggregateVersions } from '@/lib/libraryUtils';
import { RecordingRow } from '@/components/version-row';
import SectionHeader from './SectionHeader';

export default function VersionsSection() {
  const { wishlist } = useWishlist();
  const { currentSong, isPlaying, playSong } = usePlayer();

  const versions = useMemo(
    () => aggregateVersions(wishlist.items),
    [wishlist.items],
  );

  const displayed = versions.slice(0, 5);

  return (
    <section>
      <SectionHeader
        dotColor="var(--tertiary)"
        name="VERSIONS"
        count={versions.length}
      />
      {versions.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Like versions of songs to see them here.</p>
      ) : (
      <div className="flex flex-col gap-[6px]">
        {displayed.map((version) => {
          const song = version.songs[0];
          return (
            <div
              key={version.trackTitle}
              className="rounded-[5px] p-[10px] px-3 transition-[border-color,background] duration-[0.12s]"
              style={{
                background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
                border: '1px solid var(--border-subtle-token)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--text-primary) 13%, transparent)';
                e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 5%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle-token)';
                e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 3%, transparent)';
              }}
            >
              <RecordingRow
                song={song}
                size="sm"
                showTitle
                showDuration
                showMediumIcon
                showLocation={false}
                showTaper={false}
                showBadges
                showDownloads={false}
                versionCount={version.count}
                venueAsLink
                actions={['play', 'play-next', 'queue', 'playlist', 'favorite']}
                actionsAlign="start"
                onPlay={() => playSong(song)}
                isCurrentlyPlaying={currentSong?.id === song.id && isPlaying}
                availableVersions={version.songs}
              />
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
