'use client';

import { Song } from '@/lib/types';
import SectionHeader from './SectionHeader';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { usePlayer } from '@/context/PlayerContext';
import { RecordingRow } from '@/components/version-row';

export default function RecentSection() {
  const { recentlyPlayed } = useRecentlyPlayed();
  const { currentSong, isPlaying, playSong } = usePlayer();

  const visible = recentlyPlayed.slice(0, 5);

  return (
    <section>
      <SectionHeader
        dotColor="var(--senary)"
        name="RECENTLY PLAYED"
        count={recentlyPlayed.length}
        seeAllLabel="Full history →"
      />
      {recentlyPlayed.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Songs you play will appear here.</p>
      ) : (
      <div className="flex flex-col gap-[6px]">
        {visible.map((item, i) => {
          const song = item.song as Song;
          return (
            <div
              key={item.songId + '-' + i}
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
                venueAsLink
                actions={['play', 'play-next', 'queue', 'playlist', 'favorite']}
                actionsAlign="start"
                onPlay={() => playSong(song)}
                isCurrentlyPlaying={currentSong?.id === song.id && isPlaying}
              />
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
