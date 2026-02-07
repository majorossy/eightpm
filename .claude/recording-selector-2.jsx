import { useState, useEffect } from "react";

// -- Mock data with ALL 27 fields --
const RECORDINGS = [
  {
    id: 1,
    date: "12/29/14",
    venue: "Variety Playhouse",
    location: "Atlanta, GA",
    recordingType: "AUD",
    isPlaying: false,
    showRuntime: "2:18:00",
    trackLength: "7:02",
    rating: 4.2,
    reviewCount: 14,
    totalDownloads: 1847,
    downloadsWeek: 12,
    downloadsMonth: 48,
    taper: "z-man",
    source: "flac16",
    lineage: "Sound Devices 722 > SD Card > Audacity > FLAC",
    album: null,
    originalFile: "rre2014-12-29d2t04.flac",
    tags: "The Good Life, jam, encore",
    identifier: "rre2014-12-29.flac16",
    archiveUrl: "https://archive.org/details/rre2014-12-29.flac16",
    addedDate: "2015-01-15",
    publicDate: "2015-01-15",
    streamable: true,
    access: "public",
    license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    licenseLabel: "CC BY-NC-ND 4.0",
    notes: "Great energy from the crowd. Slight wind noise in first 30 seconds.",
  },
  {
    id: 2,
    date: "12/29/14",
    venue: "Variety Playhouse",
    location: "Atlanta, GA",
    recordingType: "AUD",
    isPlaying: false,
    showRuntime: null,
    trackLength: "6:27",
    rating: 3.8,
    reviewCount: 6,
    totalDownloads: 923,
    downloadsWeek: 5,
    downloadsMonth: 22,
    taper: "gerry gladu",
    source: "16bit",
    lineage: "SDHC card > USB > Audacity > FLAC",
    album: null,
    originalFile: "rre2014-12-29_gladu_t08.flac",
    tags: "The Good Life",
    identifier: "rre2014-12-29.16bit",
    archiveUrl: "https://archive.org/details/rre2014-12-29.16bit",
    addedDate: "2015-01-12",
    publicDate: "2015-01-12",
    streamable: true,
    access: "public",
    license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    licenseLabel: "CC BY-NC-ND 4.0",
    notes: null,
  },
  {
    id: 3,
    date: "12/14/14",
    venue: "Now Sapphire Resort",
    location: "Riviera Maya, MX",
    recordingType: "AUD",
    isPlaying: false,
    showRuntime: null,
    trackLength: "8:02",
    rating: null,
    reviewCount: 0,
    totalDownloads: 412,
    downloadsWeek: 2,
    downloadsMonth: 9,
    taper: null,
    source: "flac16",
    lineage: null,
    album: null,
    originalFile: null,
    tags: null,
    identifier: "rre2014-12-14.flac16",
    archiveUrl: "https://archive.org/details/rre2014-12-14.flac16",
    addedDate: "2015-02-03",
    publicDate: "2015-02-03",
    streamable: true,
    access: "public",
    license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    licenseLabel: "CC BY-NC-ND 4.0",
    notes: null,
  },
  {
    id: 4,
    date: "12/14/14",
    venue: "Strings & Sol — Main Stage",
    location: "Riviera Maya, MX",
    recordingType: "SBD",
    isPlaying: true,
    showRuntime: "2:34:00",
    trackLength: "7:45",
    rating: 4.5,
    reviewCount: 31,
    totalDownloads: 3201,
    downloadsWeek: 28,
    downloadsMonth: 112,
    taper: "SBD",
    source: "flac24",
    lineage: "Soundboard > ProTools > WAV > FLAC24",
    album: "Live at Strings & Sol 2014",
    originalFile: "rre_sol_2014_good_life.flac",
    tags: "The Good Life, soundboard, official, jam",
    identifier: "rre2014-12-14.sbd",
    archiveUrl: "https://archive.org/details/rre2014-12-14.sbd",
    addedDate: "2015-01-20",
    publicDate: "2015-01-25",
    streamable: true,
    access: "public",
    license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    licenseLabel: "CC BY-NC-SA 4.0",
    notes: "Official soundboard release. Mixed by Dave Bruzza.",
  },
  {
    id: 5,
    date: "09/20/14",
    venue: "Red Rocks Amphitheatre",
    location: "Morrison, CO",
    recordingType: "MX",
    isPlaying: false,
    showRuntime: "2:48:00",
    trackLength: "9:18",
    rating: 4.8,
    reviewCount: 52,
    totalDownloads: 8420,
    downloadsWeek: 45,
    downloadsMonth: 198,
    taper: "Charlie Miller",
    source: "flac24",
    lineage: "Schoeps MK4V > Nbob > Sound Devices 744T > WAV > FLAC24",
    album: null,
    originalFile: "rre2014-09-20_cm_d2t06.flac",
    tags: "The Good Life, schoeps, matrix, red rocks, extended jam",
    identifier: "rre2014-09-20.cm.flac24",
    archiveUrl: "https://archive.org/details/rre2014-09-20.cm.flac24",
    addedDate: "2014-09-25",
    publicDate: "2014-09-26",
    streamable: true,
    access: "public",
    license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    licenseLabel: "CC BY-NC-ND 4.0",
    notes: "Legendary Red Rocks show. Extended jam section with Tim Carbone fiddle solo. Charlie Miller matrix of SBD + Schoeps.",
  },
  {
    id: 6,
    date: "07/04/14",
    venue: "High Sierra Music Festival",
    location: "Quincy, CA",
    recordingType: "AUD",
    isPlaying: false,
    showRuntime: "1:45:00",
    trackLength: "6:55",
    rating: 3.5,
    reviewCount: 3,
    totalDownloads: 310,
    downloadsWeek: 1,
    downloadsMonth: 4,
    taper: "Jeff Collins",
    source: "mp3",
    lineage: "iPhone 6 > Voice Memo > MP3",
    album: null,
    originalFile: null,
    tags: "The Good Life, festival",
    identifier: "rre2014-07-04.mp3",
    archiveUrl: "https://archive.org/details/rre2014-07-04.mp3",
    addedDate: "2014-07-10",
    publicDate: "2014-07-10",
    streamable: true,
    access: "public",
    license: null,
    licenseLabel: null,
    notes: "Crowd recording, decent quality for phone capture.",
  },
];

// ============ Utility Components ============

function formatNum(n) {
  if (n == null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function RecTypeBadge({ type }) {
  const cfg = {
    SBD: { bg: "#2d4a2a", border: "#4a8a45", text: "#7ddf7d", label: "SBD", title: "Soundboard" },
    AUD: { bg: "#2a3548", border: "#4578a8", text: "#7db8df", label: "AUD", title: "Audience" },
    MX:  { bg: "#48392a", border: "#a87845", text: "#dfb87d", label: "MX",  title: "Matrix" },
    MTX: { bg: "#48392a", border: "#a87845", text: "#dfb87d", label: "MTX", title: "Matrix" },
  };
  const c = cfg[type] || { bg: "#333", border: "#555", text: "#aaa", label: type, title: type };
  return (
    <span title={c.title} style={{
      background: c.bg, color: c.text, padding: "2px 7px", borderRadius: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
      border: `1px solid ${c.border}55`, lineHeight: "18px", display: "inline-block",
    }}>{c.label}</span>
  );
}

function SourceBadge({ source }) {
  const cfg = {
    flac24: { bg: "#1e3320", text: "#6bce6b", label: "FLAC 24" },
    flac16: { bg: "#1e2b38", text: "#6ba8ce", label: "FLAC 16" },
    "16bit": { bg: "#1e2b38", text: "#6ba8ce", label: "16-BIT" },
    mp3: { bg: "#38301e", text: "#ce9a5a", label: "MP3" },
  };
  const c = cfg[source] || { bg: "#2a2a2a", text: "#999", label: source };
  return (
    <span style={{
      background: c.bg, color: c.text, padding: "2px 7px", borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      border: `1px solid ${c.text}30`, lineHeight: "18px", display: "inline-block",
    }}>{c.label}</span>
  );
}

function Stars({ rating, count }) {
  if (rating == null) return <span style={{ color: "#5a4e40", fontSize: 12, fontStyle: "italic" }}>No ratings yet</span>;
  const pct = (rating / 5) * 100;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ position: "relative", display: "inline-block", width: 70, height: 14 }}>
        <span style={{ color: "#3a3020", fontSize: 14, letterSpacing: 1, position: "absolute" }}>★★★★★</span>
        <span style={{ color: "#d4a056", fontSize: 14, letterSpacing: 1, position: "absolute", overflow: "hidden", width: `${pct}%`, whiteSpace: "nowrap" }}>★★★★★</span>
      </span>
      <span style={{ color: "#d4a056", fontSize: 13, fontWeight: 600 }}>{rating.toFixed(1)}</span>
      {count > 0 && <span style={{ color: "#5a4e40", fontSize: 11 }}>({count})</span>}
    </span>
  );
}

function SpinningReel({ size = 16 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{
        display: "inline-block", width: size, height: size,
        border: "2px solid #d4a056", borderRadius: "50%",
        borderTopColor: "transparent",
        animation: "spin 1s linear infinite",
      }} />
      <span style={{ color: "#d4a056", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>NOW PLAYING</span>
    </span>
  );
}

function Row({ label, value, mono, link, linkLabel }) {
  if (value == null && !link) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "4px 0", borderBottom: "1px solid #ffffff06", gap: 16,
    }}>
      <span style={{ color: "#6b5c4c", fontSize: 12, flexShrink: 0, minWidth: 90 }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{
          color: "#8cb4d4", fontSize: 12, textDecoration: "none", textAlign: "right",
          wordBreak: "break-all", maxWidth: "65%",
        }}>{linkLabel || value || link}</a>
      ) : (
        <span style={{
          color: "#c4b5a0", fontSize: 12, textAlign: "right", wordBreak: "break-word",
          maxWidth: "65%", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          fontSize: mono ? 11 : 12,
        }}>{value}</span>
      )}
    </div>
  );
}

function TagPills({ tags }) {
  if (!tags) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: "65%" }}>
      {tags.split(",").map((t, i) => (
        <span key={i} style={{
          background: "#ffffff08", color: "#9a8a72", padding: "1px 8px",
          borderRadius: 10, fontSize: 11, border: "1px solid #ffffff08", whiteSpace: "nowrap",
        }}>{t.trim()}</span>
      ))}
    </div>
  );
}

// ============ Section Toggle (for detail groups) ============
function DetailSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  // Check if children actually render anything
  const hasContent = children != null;
  if (!hasContent) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%",
        padding: "8px 0", background: "none", border: "none", borderBottom: "1px solid #ffffff08",
        cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{
          color: "#8a7a65", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", flex: 1,
        }}>{title}</span>
        <span style={{
          color: "#5a4e40", fontSize: 10, transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0)",
        }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "4px 0 8px 0", animation: "fadeIn 0.15s ease" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============ Main Card ============
function RecordingCard({ rec, isSelected, onSelect, expanded, onToggleExpand }) {
  const isBest = rec.rating && RECORDINGS.every(r => !r.rating || r.rating <= rec.rating);

  return (
    <div style={{
      background: isSelected ? "#1e1a14" : "#15120d",
      border: isSelected ? "1px solid #d4a05644" : "1px solid #ffffff08",
      borderRadius: 12, overflow: "hidden", transition: "all 0.2s",
      position: "relative",
    }}>
      {/* ---- TIER 1: Always Visible — The Decision Layer ---- */}
      <div style={{ padding: "14px 14px 10px", cursor: "pointer" }} onClick={() => onSelect(rec.id)}>
        {/* Top row: date, badges, playing state */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ color: "#d4a056", fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{rec.date}</span>
          <RecTypeBadge type={rec.recordingType} />
          <SourceBadge source={rec.source} />
          {isBest && (
            <span style={{
              background: "#d4a056", color: "#1a1510", padding: "1px 6px", borderRadius: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
            }}>★ TOP</span>
          )}
          <span style={{ flex: 1 }} />
          {rec.isPlaying && <SpinningReel />}
        </div>

        {/* Venue + Location */}
        <h3 style={{ color: "#e8dcc8", fontSize: 15, fontWeight: 600, margin: "0 0 2px", lineHeight: 1.3 }}>{rec.venue}</h3>
        <div style={{ color: "#7a6b5a", fontSize: 12, marginBottom: 10 }}>{rec.location}</div>

        {/* Key stats strip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          padding: "8px 0 4px", borderTop: "1px solid #ffffff08",
        }}>
          {/* Track length */}
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5a4e40", fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>TRACK</div>
            <div style={{ color: "#c4b5a0", fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{rec.trackLength}</div>
          </div>
          {/* Show runtime */}
          {rec.showRuntime && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#5a4e40", fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>SHOW</div>
              <div style={{ color: "#9a8a72", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{rec.showRuntime}</div>
            </div>
          )}
          <div style={{ width: 1, height: 24, background: "#ffffff0a" }} />
          {/* Rating */}
          <div>
            <div style={{ color: "#5a4e40", fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>RATING</div>
            <Stars rating={rec.rating} count={rec.reviewCount} />
          </div>
          <span style={{ flex: 1 }} />
          {/* Downloads mini */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#5a4e40", fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>DOWNLOADS</div>
            <span style={{ color: "#9a8a72", fontSize: 13, fontWeight: 500 }}>{formatNum(rec.totalDownloads)}</span>
          </div>
        </div>

        {/* Taper line */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <span style={{ fontSize: 11 }}>{rec.recordingType === "SBD" ? "🎛" : "🎤"}</span>
          <span style={{ color: "#9a8a72", fontSize: 12 }}>
            {rec.taper || <span style={{ color: "#5a4e40", fontStyle: "italic" }}>Unknown taper</span>}
          </span>
        </div>
      </div>

      {/* ---- EXPAND TOGGLE ---- */}
      <button onClick={(e) => { e.stopPropagation(); onToggleExpand(rec.id); }} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        width: "100%", padding: "7px", background: expanded ? "#ffffff04" : "transparent",
        border: "none", borderTop: "1px solid #ffffff08", color: "#5a4e40",
        fontSize: 10, cursor: "pointer", letterSpacing: "0.06em", fontWeight: 600,
      }}>
        {expanded ? "HIDE DETAILS" : "ALL DETAILS"}
        <span style={{ display: "inline-block", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>

      {/* ---- TIER 2: Expanded — Full Details ---- */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", animation: "fadeIn 0.2s ease" }}>

          {/* Quality & Stats */}
          <DetailSection title="Quality & Stats" icon="⭐" defaultOpen={true}>
            <Row label="Rating" value={rec.rating ? `${rec.rating.toFixed(1)} / 5` : null} />
            <Row label="Reviews" value={rec.reviewCount > 0 ? rec.reviewCount : null} />
            <Row label="Total DLs" value={formatNum(rec.totalDownloads)} />
            <Row label="DLs / Week" value={rec.downloadsWeek} />
            <Row label="DLs / Month" value={rec.downloadsMonth} />
          </DetailSection>

          {/* Recording Source */}
          <DetailSection title="Recording Source" icon="🎙" defaultOpen={true}>
            <Row label="Taper" value={rec.taper} />
            <Row label="Source" value={rec.source} mono />
            <Row label="Lineage" value={rec.lineage} mono />
          </DetailSection>

          {/* Track Metadata */}
          <DetailSection title="Track Metadata" icon="💿">
            <Row label="Album" value={rec.album} />
            <Row label="Original File" value={rec.originalFile} mono />
            {rec.tags && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                padding: "4px 0", borderBottom: "1px solid #ffffff06", gap: 16,
              }}>
                <span style={{ color: "#6b5c4c", fontSize: 12, flexShrink: 0, minWidth: 90 }}>Tags</span>
                <TagPills tags={rec.tags} />
              </div>
            )}
            {rec.notes && (
              <div style={{ marginTop: 6, padding: "8px 10px", background: "#ffffff04", borderRadius: 6, border: "1px solid #ffffff06" }}>
                <div style={{ color: "#6b5c4c", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>NOTES</div>
                <div style={{ color: "#a89880", fontSize: 12, lineHeight: 1.5 }}>{rec.notes}</div>
              </div>
            )}
          </DetailSection>

          {/* Archive.org */}
          <DetailSection title="Archive.org" icon="🏛">
            <Row label="Identifier" value={rec.identifier} mono />
            <Row label="Added" value={rec.addedDate} />
            <Row label="Public Date" value={rec.publicDate} />
            <Row label="Streamable" value={rec.streamable ? "Yes" : "No"} />
            <Row label="Access" value={rec.access} />
            {rec.licenseLabel && <Row label="License" value={rec.licenseLabel} link={rec.license} linkLabel={rec.licenseLabel} />}
            <Row label="View" value="Open on Archive.org →" link={rec.archiveUrl} linkLabel="Open on Archive.org →" />
          </DetailSection>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); onSelect(rec.id); }} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", background: "#d4a056", color: "#1a1510", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              <span>▶</span> Play
            </button>
            <button onClick={(e) => e.stopPropagation()} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", background: "transparent", color: "#9a8a72",
              border: "1px solid #ffffff12", borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}>
              <span>+</span> Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Compact Row (with expandable details) ============
function CompactRow({ rec, isSelected, onSelect, expanded, onToggleExpand }) {
  const GRID_COLS = "20px 72px 1fr 44px 52px 56px 58px 70px 56px 28px";

  return (
    <div style={{
      borderBottom: "1px solid #ffffff06",
      borderLeft: isSelected ? "2px solid #d4a056" : "2px solid transparent",
      background: isSelected ? "#1e1a14" : expanded ? "#17140f" : "transparent",
      transition: "all 0.15s",
    }}>
      {/* ---- Summary Row ---- */}
      <div onClick={() => onToggleExpand(rec.id)} style={{
        display: "grid", gridTemplateColumns: GRID_COLS,
        alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer",
      }}>
        {/* Playing */}
        <div>{rec.isPlaying ? <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #d4a056", borderRadius: "50%", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> : null}</div>
        {/* Date */}
        <span style={{ color: "#9a8a72", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{rec.date}</span>
        {/* Venue + Location */}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#e8dcc8", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.venue}</div>
          <div style={{ color: "#5a4e40", fontSize: 11 }}>{rec.location}</div>
        </div>
        {/* Rec Type */}
        <RecTypeBadge type={rec.recordingType} />
        {/* Source */}
        <SourceBadge source={rec.source} />
        {/* Track */}
        <span style={{ color: "#c4b5a0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>{rec.trackLength}</span>
        {/* Taper */}
        <span style={{ color: "#7a6b5a", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.taper || "—"}</span>
        {/* Rating */}
        <div style={{ textAlign: "right" }}>
          {rec.rating ? (
            <span style={{ color: "#d4a056", fontSize: 12 }}>
              {"★".repeat(Math.round(rec.rating))}
              <span style={{ marginLeft: 3, fontWeight: 600 }}>{rec.rating.toFixed(1)}</span>
            </span>
          ) : <span style={{ color: "#3a3020", fontSize: 11 }}>—</span>}
        </div>
        {/* Downloads */}
        <span style={{ color: "#6b5c4c", fontSize: 11, textAlign: "right" }}>{formatNum(rec.totalDownloads)}</span>
        {/* Expand chevron */}
        <span style={{
          color: "#5a4e40", fontSize: 10, textAlign: "center",
          transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0)",
        }}>▾</span>
      </div>

      {/* ---- Expanded Detail Panel ---- */}
      {expanded && (
        <div style={{
          padding: "0 12px 14px 104px", /* 20+72+12gap = ~104 left indent to align under venue */
          animation: "fadeIn 0.15s ease",
        }}>
          {/* Two-column detail layout for list view */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>

            {/* Left column */}
            <div>
              {/* Performance */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#8a7a65", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #ffffff08" }}>
                  🎙 Recording Source
                </div>
                <Row label="Taper" value={rec.taper} />
                <Row label="Source" value={rec.source} mono />
                <Row label="Lineage" value={rec.lineage} mono />
              </div>

              {/* Quality & Stats */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#8a7a65", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #ffffff08" }}>
                  ⭐ Quality & Stats
                </div>
                <Row label="Rating" value={rec.rating ? `${rec.rating.toFixed(1)} / 5` : null} />
                <Row label="Reviews" value={rec.reviewCount > 0 ? rec.reviewCount : null} />
                <Row label="Total DLs" value={formatNum(rec.totalDownloads)} />
                <Row label="DLs / Week" value={rec.downloadsWeek} />
                <Row label="DLs / Month" value={rec.downloadsMonth} />
                {rec.showRuntime && <Row label="Show Runtime" value={rec.showRuntime} mono />}
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Track Metadata */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#8a7a65", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #ffffff08" }}>
                  💿 Track Metadata
                </div>
                <Row label="Album" value={rec.album} />
                <Row label="Original File" value={rec.originalFile} mono />
                {rec.tags && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "4px 0", borderBottom: "1px solid #ffffff06", gap: 16,
                  }}>
                    <span style={{ color: "#6b5c4c", fontSize: 12, flexShrink: 0, minWidth: 90 }}>Tags</span>
                    <TagPills tags={rec.tags} />
                  </div>
                )}
                {rec.notes && (
                  <div style={{ marginTop: 6, padding: "6px 8px", background: "#ffffff04", borderRadius: 6, border: "1px solid #ffffff06" }}>
                    <div style={{ color: "#6b5c4c", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>NOTES</div>
                    <div style={{ color: "#a89880", fontSize: 11, lineHeight: 1.5 }}>{rec.notes}</div>
                  </div>
                )}
              </div>

              {/* Archive.org */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#8a7a65", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #ffffff08" }}>
                  🏛 Archive.org
                </div>
                <Row label="Identifier" value={rec.identifier} mono />
                <Row label="Added" value={rec.addedDate} />
                <Row label="Public Date" value={rec.publicDate} />
                <Row label="Streamable" value={rec.streamable ? "Yes" : "No"} />
                <Row label="Access" value={rec.access} />
                {rec.licenseLabel && <Row label="License" value={rec.licenseLabel} link={rec.license} linkLabel={rec.licenseLabel} />}
                <Row label="View" value="Open on Archive.org →" link={rec.archiveUrl} linkLabel="Open on Archive.org →" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 4, maxWidth: 300 }}>
            <button onClick={(e) => { e.stopPropagation(); onSelect(rec.id); }} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px", background: "#d4a056", color: "#1a1510", border: "none",
              borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              <span>▶</span> Play
            </button>
            <button onClick={(e) => e.stopPropagation()} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px", background: "transparent", color: "#9a8a72",
              border: "1px solid #ffffff12", borderRadius: 7, fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}>
              <span>+</span> Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Sort Button ============
function SortBtn({ label, active, dir, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 6,
      border: active ? "1px solid #d4a05633" : "1px solid #ffffff08",
      background: active ? "#d4a05612" : "transparent",
      color: active ? "#d4a056" : "#6b5c4c",
      fontSize: 11, cursor: "pointer", fontWeight: active ? 600 : 400,
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {label}{active && <span style={{ fontSize: 9 }}>{dir === "desc" ? "↓" : "↑"}</span>}
    </button>
  );
}

// ============ Main App ============
export default function RecordingSelector() {
  const [selected, setSelected] = useState(5);
  const [expanded, setExpanded] = useState(new Set());
  const [view, setView] = useState("cards");
  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const sorted = [...RECORDINGS].sort((a, b) => {
    const m = sortDir === "desc" ? -1 : 1;
    const get = (r) => {
      if (sortBy === "rating") return r.rating || 0;
      if (sortBy === "downloads") return r.totalDownloads || 0;
      if (sortBy === "date") {
        const [mm, dd, yy] = r.date.split("/");
        return new Date(`20${yy}-${mm}-${dd}`).getTime();
      }
      if (sortBy === "length") {
        const p = r.trackLength.split(":");
        return (+p[0]) * 60 + (+p[1]);
      }
      return 0;
    };
    return (get(a) - get(b)) * m;
  });

  const selectedRec = RECORDINGS.find(r => r.id === selected);

  return (
    <div style={{
      background: "#0f0d0a", minHeight: "100vh", padding: "20px 16px 100px",
      fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 960, margin: "0 auto",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        button:hover { filter:brightness(1.12); }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:#3a3020; border-radius:3px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 15, color: "#d4a056" }}>✦</span>
          <h2 style={{ color: "#e8dcc8", fontSize: 17, fontWeight: 600, margin: 0 }}>Choose Your Recording</h2>
        </div>
        <p style={{ color: "#6b5c4c", fontSize: 12, margin: "2px 0 0 23px" }}>
          {RECORDINGS.length} recordings of <span style={{ color: "#b8a48c" }}>"The Good Life"</span> · Railroad Earth
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "#4a4030", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginRight: 2 }}>SORT</span>
          {["rating", "downloads", "date", "length"].map(s => (
            <SortBtn key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={sortBy === s} dir={sortDir} onClick={() => handleSort(s)} />
          ))}
        </div>
        <div style={{ display: "flex", background: "#ffffff06", borderRadius: 7, padding: 2, border: "1px solid #ffffff08" }}>
          {[{ k: "cards", i: "▦" }, { k: "compact", i: "☰" }].map(v => (
            <button key={v.k} onClick={() => setView(v.k)} style={{
              padding: "4px 11px", borderRadius: 5, border: "none",
              background: view === v.k ? "#d4a05618" : "transparent",
              color: view === v.k ? "#d4a056" : "#4a4030",
              fontSize: 13, cursor: "pointer",
            }}>{v.i}</button>
          ))}
        </div>
      </div>

      {/* Cards View */}
      {view === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 10 }}>
          {sorted.map(rec => (
            <RecordingCard key={rec.id} rec={rec} isSelected={selected === rec.id}
              onSelect={setSelected} expanded={expanded.has(rec.id)} onToggleExpand={toggleExpand} />
          ))}
        </div>
      ) : (
        /* Compact View */
        <div style={{ background: "#15120d", borderRadius: 10, border: "1px solid #ffffff08", overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "20px 72px 1fr 44px 52px 56px 58px 70px 56px 28px",
            gap: 8, padding: "6px 12px",
            borderBottom: "1px solid #ffffff0a", color: "#4a4030",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          }}>
            <span></span><span>DATE</span><span>VENUE</span><span>TYPE</span><span>SRC</span>
            <span style={{ textAlign: "right" }}>TIME</span><span>TAPER</span>
            <span style={{ textAlign: "right" }}>RATING</span>
            <span style={{ textAlign: "right" }}>DLS</span><span></span>
          </div>
          {sorted.map(rec => (
            <CompactRow key={rec.id} rec={rec} isSelected={selected === rec.id}
              onSelect={setSelected} expanded={expanded.has(rec.id)} onToggleExpand={toggleExpand} />
          ))}
        </div>
      )}

      {/* Sticky playbar */}
      {selectedRec && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(180deg, #1e1a14ee 0%, #1a1610ff 100%)",
          borderTop: "1px solid #d4a05622", padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(16px)", zIndex: 100,
        }}>
          <div style={{ maxWidth: 960, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {selectedRec.isPlaying && <SpinningReel size={14} />}
              <div>
                <div style={{ color: "#e8dcc8", fontSize: 14, fontWeight: 500 }}>{selectedRec.venue}</div>
                <div style={{ color: "#6b5c4c", fontSize: 11 }}>{selectedRec.date} · {selectedRec.location} · {selectedRec.trackLength}</div>
              </div>
              <RecTypeBadge type={selectedRec.recordingType} />
              <SourceBadge source={selectedRec.source} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                background: "#d4a056", color: "#1a1510", border: "none", borderRadius: 8,
                padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}><span>▶</span> Play</button>
              <button style={{
                background: "transparent", color: "#9a8a72", border: "1px solid #ffffff12",
                borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>+ Queue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
