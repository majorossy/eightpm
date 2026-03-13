'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SongItem, Song } from '@/lib/types';
import { getTrackCatalog, getVersionsForTrack } from '@/lib/api';
import VersionPickerModal from '@/components/VersionPickerModal';
import RecordingRow from '@/components/version-row/molecules/RecordingRow';
import RecordingMediumIcon from '@/components/RecordingMediumIcon';
import {
  ReelToReelIcon, CassetteIcon, DATIcon, MiniDiscIcon,
  CDRIcon, FlashRecorderIcon, SDCardIcon, UnknownIcon,
} from '@/components/media-icons';
import DateDisplay from '@/components/version-row/atoms/DateDisplay';
import VenueDisplay from '@/components/version-row/atoms/VenueDisplay';
import RecTypeBadge from '@/components/version-row/atoms/RecTypeBadge';
import StarRating from '@/components/version-row/atoms/StarRating';
import RecordingRowActions from '@/components/version-row/atoms/RecordingRowActions';
import { usePlayer } from '@/context/PlayerContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/** Grid cell that measures its own width via ResizeObserver and sets an explicit
 *  pixel width on an inner wrapper. This forces text to wrap within the column
 *  without needing overflow:hidden (which breaks overflow-y:visible). */
function GridCell({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    setW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={style}>
      <div style={{ width: w || undefined, overflowWrap: 'anywhere' }}>
        {children}
      </div>
    </div>
  );
}

interface SongsTableProps {
  artistSlug?: string;
  initialData?: {
    items: SongItem[];
    totalCount: number;
    totalPages: number;
  };
}

// API-sortable fields (server-side across all pages)
type ApiSortField = 'VERSION_COUNT' | 'TITLE' | 'ALBUM' | 'ARTIST';
// Version-column fields (client-side sort on current page, from localStorage prefs)
type VersionSortField = 'DATE' | 'VENUE' | 'LOCATION' | 'TAPER' | 'TYPE' | 'RATING' | 'DOWNLOADS';
type SortField = ApiSortField | VersionSortField;
type SortDir = 'ASC' | 'DESC';

const API_SORT_FIELDS: Set<string> = new Set(['VERSION_COUNT', 'TITLE', 'ALBUM', 'ARTIST']);

const PAGE_SIZE = 20;
const PREFS_KEY = '8pm-song-version-prefs';

function fmtDuration(secs: number | null | undefined): string {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Shared grid template for desktop — guarantees column alignment across header + all rows
// Columns: Art | Title | Len | Src | Actions | Date | Venue | Location | Taper | Type | Rating | DLs
// All columns fixed-width so every row (with or without a picked version) is identical.
const DESKTOP_GRID = '42px 1.2fr 52px 24px 320px 80px 120px 100px 96px 36px 56px 44px';
const DESKTOP_GAP = '0 12px'; // column gap only

function loadVersionPrefs(): Record<number, Song> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveVersionPref(categoryId: number, song: Song) {
  const prefs = loadVersionPrefs();
  prefs[categoryId] = song;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function SongsTable({ artistSlug, initialData }: SongsTableProps) {
  const [songs, setSongs] = useState<SongItem[]>(initialData?.items ?? []);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount ?? 0);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('VERSION_COUNT');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const [searchInput, setSearchInput] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Version picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSong, setPickerSong] = useState<SongItem | null>(null);
  const [versions, setVersions] = useState<Song[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Saved version preferences (categoryId -> full Song object)
  const [versionPrefs, setVersionPrefs] = useState<Record<number, Song>>({});

  // Column filter state
  const [srcFilter, setSrcFilter] = useState<Set<string>>(new Set());
  const [mediumFilter, setMediumFilter] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState<number | null>(null);

  const { playSong } = usePlayer();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    setVersionPrefs(loadVersionPrefs());
  }, []);

  // Last API sort used for fetching (version sorts don't trigger re-fetch)
  const apiSortRef = useRef<{ field: ApiSortField; dir: SortDir }>({ field: 'VERSION_COUNT', dir: 'DESC' });

  const fetchSongs = useCallback(async (page: number, sort: ApiSortField, dir: SortDir, searchTerm: string) => {
    setLoading(true);
    const result = await getTrackCatalog({
      artistSlug,
      search: searchTerm || undefined,
      sortBy: sort,
      sortDir: dir,
      pageSize: PAGE_SIZE,
      currentPage: page,
    });
    setSongs(result.items);
    setTotalCount(result.totalCount);
    setTotalPages(result.pageInfo.totalPages);
    setLoading(false);
    apiSortRef.current = { field: sort, dir };
  }, [artistSlug]);

  useEffect(() => {
    if (!initialData) {
      fetchSongs(1, 'VERSION_COUNT', 'DESC', '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field: SortField) => {
    const newDir: SortDir = sortBy === field
      ? (sortDir === 'DESC' ? 'ASC' : 'DESC')
      : (['TITLE', 'ALBUM', 'ARTIST', 'VENUE', 'LOCATION', 'TAPER', 'TYPE'].includes(field) ? 'ASC' : 'DESC');

    setSortBy(field);
    setSortDir(newDir);

    // API sorts trigger a re-fetch; version sorts are applied client-side in useMemo
    if (API_SORT_FIELDS.has(field)) {
      setCurrentPage(1);
      fetchSongs(1, field as ApiSortField, newDir, search);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
      fetchSongs(1, apiSortRef.current.field, apiSortRef.current.dir, value);
    }, 300);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchSongs(page, apiSortRef.current.field, apiSortRef.current.dir, search);
  };

  // ─── Client-side sorting (applied on current page for version columns) ───
  const displaySongs = useMemo(() => {
    let result = [...songs];
    const isVersionSort = !API_SORT_FIELDS.has(sortBy);

    // Apply client-side version sort
    if (isVersionSort) {
      const dir = sortDir === 'ASC' ? 1 : -1;
      result.sort((a, b) => {
        const sa = versionPrefs[a.categoryId];
        const sb = versionPrefs[b.categoryId];
        // Rows without a picked version sort to the bottom
        if (!sa && !sb) return 0;
        if (!sa) return 1;
        if (!sb) return -1;

        switch (sortBy as VersionSortField) {
          case 'DATE':
            return dir * (sa.showDate || '').localeCompare(sb.showDate || '');
          case 'VENUE':
            return dir * (sa.showVenue || sa.albumName || '').localeCompare(sb.showVenue || sb.albumName || '');
          case 'LOCATION':
            return dir * (sa.showLocation || '').localeCompare(sb.showLocation || '');
          case 'TAPER':
            return dir * (sa.taper || '').localeCompare(sb.taper || '');
          case 'TYPE':
            return dir * (sa.recordingType || 'AUD').localeCompare(sb.recordingType || 'AUD');
          case 'RATING':
            return dir * ((sa.avgRating || 0) - (sb.avgRating || 0));
          case 'DOWNLOADS':
            return dir * ((sa.downloads || 0) - (sb.downloads || 0));
          default:
            return 0;
        }
      });
    }

    // Apply column filters (AND between columns, OR within a column)
    if (srcFilter.size > 0) {
      result = result.filter(song => {
        const saved = versionPrefs[song.categoryId];
        return saved && srcFilter.has(saved.recordingType || 'AUD');
      });
    }
    if (mediumFilter.size > 0) {
      result = result.filter(song => {
        const saved = versionPrefs[song.categoryId];
        return saved && mediumFilter.has(saved.recordingMedium || '');
      });
    }
    if (minRating !== null) {
      result = result.filter(song => {
        const saved = versionPrefs[song.categoryId];
        return saved && (saved.avgRating || 0) >= minRating;
      });
    }

    return result;
  }, [songs, versionPrefs, sortBy, sortDir, srcFilter, mediumFilter, minRating]);

  const openPicker = async (song: SongItem) => {
    setPickerSong(song);
    setPickerOpen(true);
    setVersionsLoading(true);

    const categoryUid = typeof window !== 'undefined'
      ? window.btoa(String(song.categoryId))
      : Buffer.from(String(song.categoryId)).toString('base64');

    const fetched = await getVersionsForTrack(categoryUid);
    setVersions(fetched);
    setVersionsLoading(false);
  };

  // "Swap in" — saves the version as default, does NOT play
  const handleSwapVersion = (song: Song) => {
    if (!pickerSong) return;
    saveVersionPref(pickerSong.categoryId, song);
    setVersionPrefs(prev => ({ ...prev, [pickerSong.categoryId]: song }));
    setPickerOpen(false);
  };

  // "Play now" — saves the version as default AND plays it
  const handlePlayVersion = (song: Song) => {
    if (!pickerSong) return;
    saveVersionPref(pickerSong.categoryId, song);
    setVersionPrefs(prev => ({ ...prev, [pickerSong.categoryId]: song }));
    playSong(song);
    setPickerOpen(false);
  };

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return (
      <svg className="ml-0.5 w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--secondary)' }}>
        {sortDir === 'ASC'
          ? <path d="M6 2v8M6 2L3 5M6 2l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M6 10V2M6 10L3 7M6 10l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    );
  };

  // Reusable column header button
  const ColHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center cursor-pointer hover:text-[var(--text)] transition-colors truncate ${className}`}
    >
      {children}<SortArrow field={field} />
    </button>
  );

  // Inline sort button (no truncate, used in compound header)
  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center cursor-pointer transition-colors"
      style={{ color: sortBy === field ? 'var(--secondary)' : undefined }}
    >
      {children}<SortArrow field={field} />
    </button>
  );

  // ─── Filter Popover (multi-select chips) ───
  function FilterPopover({ label, options, selected, onToggle }: {
    label: string;
    options: { id: string; icon: React.ReactNode; label: string }[];
    selected: Set<string>;
    onToggle: (id: string) => void;
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 cursor-pointer hover:text-[var(--text)] transition-colors truncate ${
            selected.size > 0 ? 'text-[var(--secondary)]' : ''
          }`}
        >
          {label}
          {selected.size > 0 && (
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold leading-none"
              style={{ background: 'color-mix(in srgb, var(--secondary) 25%, transparent)', color: 'var(--secondary)' }}>
              {selected.size}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-50 rounded-xl p-3 border shadow-lg"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle-token)', boxShadow: '0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent)' }}>
            <div className="flex flex-col gap-1.5">
              {options.map(opt => {
                const active = selected.has(opt.id);
                return (
                  <button key={opt.id} onClick={() => onToggle(opt.id)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--secondary) 15%, transparent)' : 'color-mix(in srgb, var(--text) 5%, transparent)',
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--secondary) 35%, transparent)' : 'color-mix(in srgb, var(--text) 8%, transparent)'}`,
                      color: active ? 'var(--secondary)' : 'var(--text-subdued)',
                    }}>
                    <span className="shrink-0 flex items-center">{opt.icon}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Rating Filter Popover (threshold single-select) ───
  function RatingFilterPopover({ label, value, onChange }: {
    label: string;
    value: number | null;
    onChange: (v: number | null) => void;
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const thresholds = [3, 3.5, 4, 4.5, 5];

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 cursor-pointer hover:text-[var(--text)] transition-colors truncate ${
            value !== null ? 'text-[var(--secondary)]' : ''
          }`}
        >
          {label}
          {value !== null && (
            <span className="text-[8px] font-bold" style={{ color: 'var(--secondary)' }}>{value}+</span>
          )}
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 rounded-lg p-2 border min-w-[100px]"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle-token)' }}>
            <div className="flex flex-col gap-1">
              {thresholds.map(t => {
                const active = value === t;
                return (
                  <button key={t} onClick={() => { onChange(active ? null : t); setOpen(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--secondary) 20%, transparent)' : 'color-mix(in srgb, var(--text) 5%, transparent)',
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--secondary) 40%, transparent)' : 'transparent'}`,
                      color: active ? 'var(--secondary)' : 'var(--text-subdued)',
                    }}>
                    <span className="flex gap-0.5">
                      {Array.from({ length: Math.floor(t) }, (_, i) => (
                        <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 1l2.39 6.36H19l-5.19 3.78 1.98 6.36L10 13.72 4.21 17.5l1.98-6.36L1 7.36h6.61z" />
                        </svg>
                      ))}
                      {t % 1 !== 0 && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 20 20">
                          <defs><clipPath id="halfStar"><rect x="0" y="0" width="10" height="20" /></clipPath></defs>
                          <path d="M10 1l2.39 6.36H19l-5.19 3.78 1.98 6.36L10 13.72 4.21 17.5l1.98-6.36L1 7.36h6.61z" fill="currentColor" clipPath="url(#halfStar)" />
                          <path d="M10 1l2.39 6.36H19l-5.19 3.78 1.98 6.36L10 13.72 4.21 17.5l1.98-6.36L1 7.36h6.61z" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                    </span>
                    <span>{t}+</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Filter option definitions ───
  const srcOptions = [
    { id: 'SBD', icon: <RecTypeBadge type="SBD" />, label: 'Soundboard' },
    { id: 'AUD', icon: <RecTypeBadge type="AUD" />, label: 'Audience' },
    { id: 'MX', icon: <RecTypeBadge type="MX" />, label: 'Mixer' },
    { id: 'FM', icon: <RecTypeBadge type="FM" />, label: 'FM Radio' },
    { id: 'WEBCAST', icon: <RecTypeBadge type="WEB" />, label: 'Webcast' },
  ];

  const mediumOptions = [
    { id: 'cassette', icon: <CassetteIcon size={0.55} />, label: 'Cassette' },
    { id: 'dat', icon: <DATIcon size={0.55} />, label: 'DAT' },
    { id: 'reel_to_reel', icon: <ReelToReelIcon size={0.55} />, label: 'Reel' },
    { id: 'cd', icon: <CDRIcon size={0.55} />, label: 'CD-R' },
    { id: 'minidisc', icon: <MiniDiscIcon size={0.55} />, label: 'MiniDisc' },
    { id: 'flash_recorder', icon: <FlashRecorderIcon size={0.55} />, label: 'Digital' },
    { id: 'sd_card', icon: <SDCardIcon size={0.55} />, label: 'SD Card' },
    { id: '', icon: <UnknownIcon size={0.55} />, label: 'Unknown' },
  ];

  const toggleSrcFilter = (id: string) => {
    setSrcFilter(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMediumFilter = (id: string) => {
    setMediumFilter(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Generate page numbers with ellipsis for pagination
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'color-mix(in srgb, var(--surface-card) 60%, transparent)' }}>
      {/* Search + count header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle-token)]">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subdued)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter tracks..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm bg-[var(--primary)] text-[var(--text)] border border-[var(--border-subtle-token)] placeholder:text-[var(--text-subdued)] focus:outline-none focus:border-[var(--secondary)] transition-colors"
          />
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-[var(--text-subdued)] tabular-nums">
            {(srcFilter.size > 0 || mediumFilter.size > 0 || minRating !== null)
              ? `${displaySongs.length} of ${totalCount.toLocaleString()}`
              : totalCount.toLocaleString()
            } {totalCount === 1 ? 'song' : 'songs'}
          </span>
        )}
      </div>

      {/* Column headers + filters */}
      {isDesktop ? (
        <div
          className="px-4 py-2.5 text-[11px] font-semibold text-[var(--text-subdued)] uppercase tracking-wider border-b border-[var(--border-subtle-token)]/50"
          style={{ display: 'grid', gridTemplateColumns: DESKTOP_GRID, gap: DESKTOP_GAP }}
        >
          <div />
          <div className="flex items-center gap-1">
            <SortButton field="TITLE">Title</SortButton>
            <span className="text-[var(--text-subdued)] opacity-40">/</span>
            <SortButton field="ALBUM">Album</SortButton>
            <span className="text-[var(--text-subdued)] opacity-40">/</span>
            <SortButton field="ARTIST">Artist</SortButton>
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-subdued)] uppercase tracking-wider">Len</div>
          <FilterPopover label="Med" options={mediumOptions} selected={mediumFilter} onToggle={toggleMediumFilter} />
          <div />
          <ColHeader field="DATE">Date</ColHeader>
          <ColHeader field="VENUE">Venue</ColHeader>
          <ColHeader field="LOCATION">Location</ColHeader>
          <ColHeader field="TAPER"><svg width={10} height={10} viewBox="0 0 24 24" fill="none" className="shrink-0 mr-0.5"><circle cx="10" cy="5" r="3" style={{ fill: 'var(--tertiary)' }} /><path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" style={{ fill: 'color-mix(in srgb, var(--primary) 70%, var(--tertiary))' }} /><line x1="17" y1="3" x2="17" y2="19" style={{ stroke: 'var(--tertiary)' }} strokeWidth="1.5" strokeLinecap="round" /><rect x="15" y="0.5" width="4" height="4.5" rx="1.5" style={{ fill: 'var(--tertiary)' }} /><path d="M13 11l4-3.5" style={{ stroke: 'color-mix(in srgb, var(--tertiary) 60%, transparent)' }} strokeWidth="1.5" strokeLinecap="round" /></svg>Taper</ColHeader>
          <FilterPopover label="Src" options={srcOptions} selected={srcFilter} onToggle={toggleSrcFilter} />
          <RatingFilterPopover label="Rating" value={minRating} onChange={setMinRating} />
          <ColHeader field="DOWNLOADS"><svg width={10} height={10} viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 2L2 7v1h20V7L12 2z" style={{ fill: 'color-mix(in srgb, var(--quinary) 55%, transparent)' }} /><rect x="4.5" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} /><rect x="9" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} /><rect x="13" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} /><rect x="17.5" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} /><rect x="2" y="17" width="20" height="2" rx="0.5" style={{ fill: 'color-mix(in srgb, var(--quinary) 45%, transparent)' }} /></svg><svg width={6} height={10} viewBox="0 0 10 16" fill="none" className="shrink-0 mr-0.5"><path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" style={{ stroke: 'var(--text-tertiary)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>DLs</ColHeader>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-[var(--text-subdued)] uppercase tracking-wider border-b border-[var(--border-subtle-token)]/50">
          <ColHeader field="ALBUM" className="w-[36px] shrink-0">Album</ColHeader>
          <ColHeader field="TITLE" className="flex-1 min-w-0">Title</ColHeader>
          <div className="w-10 shrink-0 text-center">Len</div>
          <div className="w-56 shrink-0 text-center">My Version</div>
        </div>
      )}

      {/* Song rows */}
      <div className="divide-y divide-[var(--border-subtle-token)]/30">
        {loading && songs.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--text-subdued)]">Loading songs...</div>
        )}

        {!loading && songs.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--text-subdued)]">
            {search ? `No songs matching "${search}"` : 'No songs found'}
          </div>
        )}

        {!loading && songs.length > 0 && displaySongs.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--text-subdued)]">
            No songs match the active filters
          </div>
        )}

        {displaySongs.map((song) => {
          const saved = versionPrefs[song.categoryId];

          // ─── Desktop: CSS Grid row (perfect column alignment) ───
          if (isDesktop) {
            return (
              <div
                key={song.categoryId}
                className={`items-center px-4 h-[52px] text-left transition-all group ${
                  song.versionCount === 0 ? 'opacity-30' : 'hover:bg-[var(--surface-card)]'
                }`}
                style={{ display: 'grid', gridTemplateColumns: DESKTOP_GRID, gap: DESKTOP_GAP }}
              >
                {/* Album art */}
                <button onClick={() => openPicker(song)} disabled={song.versionCount === 0} className="w-[42px] h-[42px] rounded-md overflow-hidden bg-[var(--primary)] cursor-pointer">
                  {song.albumArtworkUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={song.albumArtworkUrl} alt="" width={42} height={42} loading="lazy" className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--text-subdued)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                  )}
                </button>

                {/* Title / Album / Artist + version count */}
                <button onClick={() => openPicker(song)} disabled={song.versionCount === 0} className="min-w-0 text-left cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--text)] truncate">{song.title}</span>
                    {song.versionCount > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 rounded-full text-[9px] font-semibold tabular-nums" style={{ background: 'rgba(160,130,200,0.14)', color: '#c0a8e0' }}>
                        {song.versionCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-subdued)] truncate">{song.albumName}</div>
                  <div className="text-[10px] text-[var(--text-subdued)] truncate opacity-60">{song.artistName}</div>
                </button>

                {/* Length / Duration */}
                <div className="flex items-center">
                  {saved ? (
                    <button onClick={() => openPicker(song)} className="font-jb-mono text-[10px] tabular-nums cursor-pointer hover:underline" style={{ color: '#c0a8e0' }} title="Swap version">
                      {fmtDuration(saved.duration)}
                    </button>
                  ) : (
                    <span className="font-jb-mono text-[10px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                      {fmtDuration(song.avgDuration)}
                    </span>
                  )}
                </div>

                {saved ? (
                  <>
                    {/* Source icon */}
                    <div className="flex justify-center">
                      <RecordingMediumIcon medium={saved.recordingMedium} lineage={saved.lineage} source={saved.source} size={0.5} />
                    </div>
                    {/* Actions */}
                    <div className="min-w-0 overflow-hidden">
                      <RecordingRowActions
                        song={saved}
                        actions={['swap', 'play', 'play-next', 'queue', 'playlist', 'favorite']}
                        size="sm"
                        swapLabel="swap out"
                        onSwap={() => openPicker(song)}
                        onPlay={(s) => playSong(s)}
                      />
                    </div>
                    {/* Date */}
                    <GridCell className="min-w-0 self-start pt-2">
                      <DateDisplay date={saved.showDate} className="font-jb-mono text-[10px] font-semibold text-primary leading-tight tracking-wide" />
                    </GridCell>
                    {/* Venue */}
                    <GridCell className="min-w-0 self-start pt-1.5 text-[10px] leading-snug">
                      <VenueDisplay venue={saved.showVenue} albumName={saved.albumName} asLink normalizedName={saved.venueNormalizedName} venueSlug={saved.venueSlug} className="text-[10px]" />
                    </GridCell>
                    {/* Location */}
                    <GridCell className="min-w-0 self-start pt-1.5">
                      {saved.showLocation && <span className="font-mono text-[9px] leading-snug" style={{ color: 'var(--text-tertiary)' }}>{saved.showLocation}</span>}
                    </GridCell>
                    {/* Taper */}
                    <GridCell className="min-w-0 self-start pt-1.5">
                      {saved.taper && <span className="font-jb-mono text-[9px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>{saved.taper}</span>}
                    </GridCell>
                    {/* Type */}
                    <div><RecTypeBadge type={saved.recordingType} /></div>
                    {/* Rating */}
                    <div><StarRating rating={saved.avgRating} count={saved.numReviews} starSize="w-2 h-2" /></div>
                    {/* Downloads */}
                    <div>{saved.downloads != null && saved.downloads > 0 && <a href={`https://archive.org/details/${saved.albumIdentifier}`} target="_blank" rel="noopener noreferrer" className="font-jb-mono text-[9px] tabular-nums hover:underline" style={{ color: 'var(--text-tertiary)' }}>{saved.downloads >= 1000 ? `${(saved.downloads / 1000).toFixed(1)}k` : saved.downloads.toLocaleString()}</a>}</div>
                  </>
                ) : (
                  /* Empty state — spans all version columns */
                  <button
                    onClick={() => openPicker(song)}
                    disabled={song.versionCount === 0}
                    className="relative flex items-center justify-center gap-2.5 h-[42px] rounded-lg cursor-pointer transition-all duration-300 overflow-hidden"
                    style={{
                      gridColumn: '4 / 13',
                      background: 'color-mix(in srgb, var(--quaternary) 4%, transparent)',
                      border: '1px dashed color-mix(in srgb, var(--quaternary) 18%, transparent)',
                    }}
                  >
                    {/* Hover glow — triggered by row hover (group) */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--quaternary) 8%, transparent), color-mix(in srgb, var(--quaternary) 3%, transparent))' }}
                    />
                    <svg className="relative w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" style={{ color: 'color-mix(in srgb, var(--quaternary) 35%, transparent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
                    </svg>
                    <span className="relative text-[11px] tracking-wide transition-all duration-300" style={{ color: 'color-mix(in srgb, var(--quaternary) 45%, transparent)' }}>
                      pick a version
                    </span>
                    <style>{`
                      .group:hover > [style*="grid-column"] { border-color: color-mix(in srgb, var(--quaternary) 35%, transparent) !important; }
                      .group:hover > [style*="grid-column"] svg { color: var(--quaternary) !important; }
                      .group:hover > [style*="grid-column"] span { color: var(--quaternary) !important; }
                    `}</style>
                  </button>
                )}
              </div>
            );
          }

          // ─── Mobile: Flex row with RecordingRow ───
          return (
            <div
              key={song.categoryId}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all group ${
                song.versionCount === 0 ? 'opacity-30' : 'hover:bg-[var(--surface-card)]'
              }`}
            >
              <button onClick={() => openPicker(song)} disabled={song.versionCount === 0} className="w-[36px] h-[36px] rounded-md overflow-hidden shrink-0 bg-[var(--primary)] cursor-pointer">
                {song.albumArtworkUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={song.albumArtworkUrl} alt="" width={36} height={36} loading="lazy" className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--text-subdued)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>
                )}
              </button>
              <button onClick={() => openPicker(song)} disabled={song.versionCount === 0} className="flex-1 min-w-0 text-left cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[var(--text)] truncate">{song.title}</span>
                  {song.versionCount > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 rounded-full text-[9px] font-semibold tabular-nums" style={{ background: 'rgba(160,130,200,0.14)', color: '#c0a8e0' }}>
                      {song.versionCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-subdued)] truncate">{song.albumName}</div>
                <div className="text-[10px] text-[var(--text-subdued)] truncate opacity-60">{song.artistName}</div>
              </button>
              <div className="w-10 shrink-0 text-center">
                {saved ? (
                  <button onClick={() => openPicker(song)} className="font-jb-mono text-[10px] tabular-nums cursor-pointer hover:underline" style={{ color: '#c0a8e0' }} title="Swap version">
                    {fmtDuration(saved.duration)}
                  </button>
                ) : (
                  <span className="font-jb-mono text-[10px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    {fmtDuration(song.avgDuration)}
                  </span>
                )}
              </div>
              <div className="w-56 shrink-0">
                {saved ? (
                  <div className="rounded-lg overflow-hidden px-2 py-1.5" style={{ background: 'color-mix(in srgb, var(--surface-card) 80%, transparent)' }}>
                    <RecordingRow
                      song={saved}
                      size="sm"
                      showTitle={true}
                      showDuration={true}
                      showMediumIcon={true}
                      showLocation={false}
                      showTaper={true}
                      showBadges={true}
                      showDownloads={true}
                      downloadFormat="compact"
                      actions={['swap', 'play-next', 'queue', 'playlist', 'favorite']}
                      onSwap={() => openPicker(song)}
                      onPlay={(s) => playSong(s)}
                      swapLabel="swap out"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => openPicker(song)}
                    disabled={song.versionCount === 0}
                    className="pick-version-btn relative w-full flex items-center justify-center gap-2.5 h-[42px] rounded-lg cursor-pointer transition-all duration-300 overflow-hidden"
                    style={{
                      background: 'color-mix(in srgb, var(--quaternary) 4%, transparent)',
                      border: '1px dashed color-mix(in srgb, var(--quaternary) 18%, transparent)',
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--quaternary) 8%, transparent), color-mix(in srgb, var(--quaternary) 3%, transparent))' }}
                    />
                    <svg className="relative w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" style={{ color: 'color-mix(in srgb, var(--quaternary) 35%, transparent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
                    </svg>
                    <span className="relative text-[11px] tracking-wide transition-all duration-300" style={{ color: 'color-mix(in srgb, var(--quaternary) 45%, transparent)' }}>
                      pick a version
                    </span>
                    <style>{`
                      .group:hover .pick-version-btn { border-color: color-mix(in srgb, var(--quaternary) 35%, transparent) !important; }
                      .group:hover .pick-version-btn svg { color: var(--quaternary) !important; }
                      .group:hover .pick-version-btn span { color: var(--quaternary) !important; }
                    `}</style>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination with page numbers */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-[var(--border-subtle-token)]">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2 py-1 text-xs font-medium rounded-md text-[var(--text)] disabled:opacity-25 hover:bg-[var(--surface-card)] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[var(--text-subdued)]">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[28px] px-1.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? 'text-[var(--secondary)] font-bold'
                    : 'text-[var(--text-subdued)] hover:text-[var(--text)] hover:bg-[var(--surface-card)]'
                }`}
                style={currentPage === page ? { background: 'color-mix(in srgb, var(--secondary) 15%, transparent)' } : undefined}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2 py-1 text-xs font-medium rounded-md text-[var(--text)] disabled:opacity-25 hover:bg-[var(--surface-card)] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Version Picker Modal */}
      {pickerSong && (
        <VersionPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          trackTitle={pickerSong.title}
          artistName={pickerSong.artistName}
          currentSongId={versionPrefs[pickerSong.categoryId]?.id || ''}
          versions={versionsLoading ? [] : versions}
          coverArt={pickerSong.albumArtworkUrl || undefined}
          onSwapVersion={handleSwapVersion}
          onPlayVersion={handlePlayVersion}
        />
      )}
    </div>
  );
}
