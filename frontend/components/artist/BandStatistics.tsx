'use client';

import React from 'react';

interface RecordingStats {
  total: number;
  sources?: {
    [key: string]: number;
  };
}

interface BandStatisticsProps {
  statistics?: {
    totalShows?: number;
    totalVenues?: number;
    mostPlayedTrack?: {
      title: string;
      playCount: number;
    };
    recordingStats?: RecordingStats;
    yearsActive?: {
      first: number;
      last: number;
    };
    topVenues?: Array<{
      name: string;
      showCount: number;
    }>;
    totalHours?: number;
  };
}

const BandStatistics: React.FC<BandStatisticsProps> = ({ statistics }) => {
  // Return null if no statistics data or all values are undefined
  if (!statistics || Object.values(statistics).every(val => val === undefined || val === null)) {
    return null;
  }

  const {
    totalShows,
    totalVenues,
    mostPlayedTrack,
    recordingStats,
    totalHours,
    yearsActive,
  } = statistics;

  // Build stats array for ember display
  const stats = [];

  if (recordingStats && recordingStats.total > 0) {
    stats.push({
      value: recordingStats.total.toLocaleString(),
      label: 'recordings',
    });
  }

  if (totalHours !== undefined && totalHours > 0) {
    stats.push({
      value: `${totalHours.toLocaleString()}+`,
      label: 'hours',
    });
  }

  if (totalShows !== undefined) {
    stats.push({
      value: totalShows.toLocaleString(),
      label: 'shows',
    });
  }

  if (totalVenues !== undefined && totalVenues > 0) {
    stats.push({
      value: totalVenues.toLocaleString(),
      label: 'venues',
    });
  }

  if (yearsActive?.first) {
    // Format year as '99 instead of 1999
    const yearStr = yearsActive.first.toString();
    const shortYear = `'${yearStr.slice(-2)}`;

    stats.push({
      value: shortYear,
      label: 'since year',
    });
  }

  if (mostPlayedTrack?.title) {
    stats.push({
      value: mostPlayedTrack.title,
      label: 'top track',
    });
  }

  // Return null if no stats to display
  if (stats.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">Archive Stats</h2>

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '100px',
            background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '60px' }}>
              <div
                className={`ember-value ember-${i}`}
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  background:
                    'var(--stats-gradient, linear-gradient(180deg, #fff8e7 0%, #ffb347 30%, #ff6b35 60%, #cc3300 100%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 10px var(--accent-glow))',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '10px',
                  color: 'var(--stats-label-color, #8b6914)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginTop: '6px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .ember-0 { animation: ember-flicker-0 2s ease-in-out infinite; }
          .ember-1 { animation: ember-flicker-1 2.3s ease-in-out infinite; }
          .ember-2 { animation: ember-flicker-2 1.8s ease-in-out infinite; }
          .ember-3 { animation: ember-flicker-3 2.1s ease-in-out infinite; }
          .ember-4 { animation: ember-flicker-4 2.4s ease-in-out infinite; }
          .ember-5 { animation: ember-flicker-5 2.2s ease-in-out infinite; }

          @keyframes ember-flicker-0 {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px color-mix(in srgb, var(--accent-primary) 40%, transparent)); }
            50% { opacity: 0.85; filter: drop-shadow(0 0 15px color-mix(in srgb, var(--accent-primary) 60%, transparent)); }
          }
          @keyframes ember-flicker-1 {
            0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent-primary) 50%, transparent)); }
            50% { opacity: 1; filter: drop-shadow(0 0 8px color-mix(in srgb, var(--accent-primary) 30%, transparent)); }
          }
          @keyframes ember-flicker-2 {
            0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 8px color-mix(in srgb, var(--accent-primary) 40%, transparent)); }
            50% { opacity: 0.8; filter: drop-shadow(0 0 18px color-mix(in srgb, var(--accent-primary) 70%, transparent)); }
          }
          @keyframes ember-flicker-3 {
            0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 14px color-mix(in srgb, var(--accent-primary) 50%, transparent)); }
            50% { opacity: 1; filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent-primary) 30%, transparent)); }
          }
          @keyframes ember-flicker-4 {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 9px color-mix(in srgb, var(--accent-primary) 45%, transparent)); }
            50% { opacity: 0.9; filter: drop-shadow(0 0 16px color-mix(in srgb, var(--accent-primary) 55%, transparent)); }
          }
          @keyframes ember-flicker-5 {
            0%, 100% { opacity: 0.92; filter: drop-shadow(0 0 11px color-mix(in srgb, var(--accent-primary) 48%, transparent)); }
            50% { opacity: 0.95; filter: drop-shadow(0 0 13px color-mix(in srgb, var(--accent-primary) 52%, transparent)); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default BandStatistics;
