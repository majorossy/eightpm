'use client';

interface VinylSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 64,
  md: 100,
  lg: 140,
};

export function VinylSpinner({ size = 'md', className = '' }: VinylSpinnerProps) {
  const dimension = sizes[size];
  const center = dimension / 2;
  const labelRadius = dimension * 0.22;

  // More grooves for better visual effect
  const grooveCount = 8;
  const grooveRadii = Array.from({ length: grooveCount }, (_, i) =>
    dimension * (0.28 + (i * 0.08))
  ).filter(r => r < center - 2);

  return (
    <div
      className={`vinyl-spinner ${className}`}
      style={{ width: dimension, height: dimension }}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="vinyl-record"
      >
        {/* Outer glow */}
        <circle
          cx={center}
          cy={center}
          r={center - 1}
          fill="none"
          stroke="var(--accent-border-decorative)"
          strokeWidth="3"
        />

        {/* Vinyl body */}
        <circle
          cx={center}
          cy={center}
          r={center - 2}
          fill="#1a1816"
          stroke="#3a3632"
          strokeWidth="1.5"
        />

        {/* Vinyl grooves - alternating opacity for visual depth */}
        {grooveRadii.map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={i % 2 === 0 ? "rgba(80, 75, 70, 0.5)" : "rgba(60, 55, 50, 0.3)"}
            strokeWidth={i % 3 === 0 ? "1" : "0.5"}
          />
        ))}

        {/* Shine/reflection highlight - more prominent */}
        <ellipse
          cx={center * 0.65}
          cy={center * 0.65}
          rx={dimension * 0.18}
          ry={dimension * 0.08}
          fill="rgba(255, 255, 255, 0.08)"
          transform={`rotate(-45 ${center * 0.65} ${center * 0.65})`}
        />

        {/* Secondary shine */}
        <ellipse
          cx={center * 1.3}
          cy={center * 1.25}
          rx={dimension * 0.1}
          ry={dimension * 0.05}
          fill="rgba(255, 255, 255, 0.04)"
          transform={`rotate(-45 ${center * 1.3} ${center * 1.25})`}
        />

        {/* Center label (amber) with ring */}
        <circle
          cx={center}
          cy={center}
          r={labelRadius + 2}
          fill="#2a2520"
        />
        <circle
          cx={center}
          cy={center}
          r={labelRadius}
          fill={`url(#labelGradient-${size})`}
        />

        {/* Label text hint - small line for visual interest */}
        <line
          x1={center - labelRadius * 0.5}
          y1={center - labelRadius * 0.3}
          x2={center + labelRadius * 0.5}
          y2={center - labelRadius * 0.3}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1"
        />
        <line
          x1={center - labelRadius * 0.3}
          y1={center}
          x2={center + labelRadius * 0.3}
          y2={center}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.5"
        />

        {/* Center hole */}
        <circle
          cx={center}
          cy={center}
          r={dimension * 0.035}
          fill="#1c1a17"
          stroke="#0a0908"
          strokeWidth="1"
        />

        {/* Gradient definition for label */}
        <defs>
          <radialGradient id={`labelGradient-${size}`} cx="35%" cy="35%">
            <stop offset="0%" stopColor="#f0b060" />
            <stop offset="50%" stopColor="#d4a060" />
            <stop offset="100%" stopColor="#b07830" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
