export type LinePoint = {
  /** Short label under the X axis, e.g. "ENE" */
  label: string;
  /** 0..100 */
  value: number | null;
};

type Variant = 'cyan' | 'gold' | 'emerald';

type Props = {
  data: LinePoint[];
  height?: number;
  variant?: Variant;
  className?: string;
};

const STROKE: Record<Variant, string> = {
  cyan: '#3fd4ff',
  gold: '#f4c355',
  emerald: '#6ee7b7'
};

const FILL_TOP: Record<Variant, string> = {
  cyan: 'rgba(63,212,255,0.35)',
  gold: 'rgba(244,195,85,0.35)',
  emerald: 'rgba(110,231,183,0.35)'
};

/**
 * Pure SVG sparkline + area. Draws a smooth(ish) line through the
 * given 0..100 points, with an area fill underneath and light
 * gridlines at 0/50/100. Skips null points gracefully (chart breaks).
 * No external chart library — keeps the bundle lean.
 */
export function PremiumLineChart({
  data,
  height = 180,
  variant = 'cyan',
  className
}: Props) {
  const width = 600; // viewBox width — scales to container
  const padX = 32;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const n = Math.max(1, data.length);
  const stepX = n > 1 ? plotW / (n - 1) : 0;

  function xAt(i: number): number {
    return padX + i * stepX;
  }
  function yAt(value: number): number {
    const clamped = Math.max(0, Math.min(100, value));
    return padTop + plotH - (clamped / 100) * plotH;
  }

  const labelValue = (v: number | null) => (v === null ? 0 : v);
  const pathD = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(labelValue(p.value))}`)
    .join(' ');
  const areaD = `${pathD} L${xAt(n - 1)},${padTop + plotH} L${xAt(0)},${padTop + plotH} Z`;

  const gradId = `line-grad-${variant}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`h-auto w-full ${className ?? ''}`}
      role="img"
      aria-label="Serie temporal"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={FILL_TOP[variant]} />
          <stop offset="100%" stopColor={FILL_TOP[variant]} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines at 0 / 50 / 100 */}
      {[0, 50, 100].map((v) => (
        <line
          key={v}
          x1={padX}
          x2={width - padX}
          y1={yAt(v)}
          y2={yAt(v)}
          stroke="rgba(148,163,184,0.10)"
          strokeDasharray="3 4"
        />
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={STROKE[variant]} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {data.map((p, i) => (
        <circle
          key={`${p.label}-${i}`}
          cx={xAt(i)}
          cy={yAt(labelValue(p.value))}
          r={3.5}
          fill={STROKE[variant]}
          stroke="#0a1120"
          strokeWidth="2"
        />
      ))}

      {/* X axis labels */}
      {data.map((p, i) => (
        <text
          key={`${p.label}-label-${i}`}
          x={xAt(i)}
          y={height - 6}
          textAnchor="middle"
          fill="#7a85a0"
          fontSize="11"
          fontWeight={600}
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
