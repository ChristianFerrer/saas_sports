type Props = {
  pct: number | null;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
};

function colorFor(pct: number | null): string {
  if (pct === null) return '#cbd5e1';
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

// Lightweight SVG ring gauge. Stroke-dasharray trick draws a % of the
// circumference; the remaining arc sits on top of a muted background
// circle. No external chart library needed.
export function AttendanceRing({
  pct,
  size = 96,
  strokeWidth = 10,
  showLabel = true
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const safe = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const dash = (safe / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={pct === null ? 'Sin datos' : `${pct}% asistencia`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {pct !== null ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colorFor(pct)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ) : null}
      {showLabel ? (
        <text
          x={cx}
          y={cy + size * 0.045}
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight={600}
          fontSize={size * 0.24}
          fill="#0f172a"
        >
          {pct === null ? '—' : `${pct}%`}
        </text>
      ) : null}
    </svg>
  );
}
