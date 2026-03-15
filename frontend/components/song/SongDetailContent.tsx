'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SongDetailData, Song } from '@/lib/types';
import { getVersionsForTrack } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { trackToQueueItem } from '@/lib/queueTypes';
import SongHero from './SongHero';
import SongStatsPanel from './SongStatsPanel';
import SongVersionsList from './SongVersionsList';

interface SongDetailContentProps {
  songDetail: SongDetailData;
}

export default function SongDetailContent({ songDetail }: SongDetailContentProps) {
  const [versions, setVersions] = useState<Song[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const { playSong } = usePlayer();
  const { addToQueue } = useQueue();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: songDetail.artistName, href: `/artists/${songDetail.artistSlug}`, type: 'artist' },
      { label: 'Songs', href: `/artists/${songDetail.artistSlug}/songs`, type: 'track' },
      { label: songDetail.title, type: 'version' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, songDetail]);

  useEffect(() => {
    async function loadVersions() {
      setVersionsLoading(true);
      const categoryUid = btoa(String(songDetail.categoryId));
      const data = await getVersionsForTrack(categoryUid);
      setVersions(data);
      setVersionsLoading(false);
    }
    loadVersions();
  }, [songDetail.categoryId]);

  const bestVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return [...versions]
      .filter(v => v.isStreamable !== false)
      .sort((a, b) => {
        const ratingDiff = (b.avgRating || 0) - (a.avgRating || 0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        return (b.downloads || 0) - (a.downloads || 0);
      })[0] || null;
  }, [versions]);

  const handlePlayBest = () => {
    if (bestVersion) playSong(bestVersion);
  };

  const handleQueue = useCallback((song: Song) => {
    addToQueue(trackToQueueItem(song));
  }, [addToQueue]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SongHero
        songDetail={songDetail}
        onPlayBest={handlePlayBest}
        bestVersionLoaded={!versionsLoading && !!bestVersion}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mt-8">
        <SongVersionsList
          versions={versions}
          loading={versionsLoading}
          onPlay={playSong}
          onQueue={handleQueue}
        />
        <SongStatsPanel songDetail={songDetail} versionCount={versions.length || songDetail.versionCount} />
      </div>
    </div>
  );
}
