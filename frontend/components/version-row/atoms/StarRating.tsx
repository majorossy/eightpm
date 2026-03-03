// StarRating — unified star rating display (replaces 4 separate implementations)

interface StarRatingProps {
  rating?: number;
  count?: number;
  starSize?: string;
  className?: string;
}

export default function StarRating({ rating, count, starSize = 'w-2.5 h-2.5', className = '' }: StarRatingProps) {
  if (!rating) return null;

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={`flex items-center gap-0.5 ${className}`} title={`${rating.toFixed(1)}/5${count ? ` (${count})` : ''}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`f${i}`} className={starSize} style={{ color: 'var(--quinary)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className={starSize} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="vr-half-star">
              <stop offset="50%" stopColor="var(--quinary)" />
              <stop offset="50%" stopColor="var(--tertiary)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#vr-half-star)" />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`e${i}`} className={starSize} style={{ color: 'var(--tertiary)', opacity: 0.3 }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {count != null && count > 0 && (
        <span className="font-jb-mono text-[9px] ml-0.5" style={{ color: 'var(--text-tertiary)' }}>
          ({count})
        </span>
      )}
    </div>
  );
}
