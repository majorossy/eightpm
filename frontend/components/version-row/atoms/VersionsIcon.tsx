// VersionsIcon — stacked rectangles SVG (extracted from VersionPickerModal)

export default function VersionsIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1" width="10" height="8" rx="1.5" />
      <path d="M5 11h6" />
      <path d="M6 13h4" />
    </svg>
  );
}
