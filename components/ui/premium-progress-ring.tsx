type Variant = 'cyan' | 'gold' | 'emerald' | 'amber' | 'red' | 'auto';

type Props = {
  /** 0..100 or null when there's no data yet. */
  value: number | null;
  size?: number;
  strokeWidth?: number;
  /** 'auto' picks emerald/amber/red by threshold. */
  variant?: Variant;
  /** Shown inside the ring (centered). Defaults to `${value}%`. */
  label?: string;
  /** Smaller caption below the main label. */
  sublabel?: string;
  className?: string;
};

const VARIANT_ID = {
  cyan: 'ring-grad-cyan',
  gold: 'ring-grad-gold',
  emerald: 'ring-grad-emerald',
  amber: 'ring-grad-amber',
  red: 'ring-grad-red'
} as const;

type SolidVariant = Exclude<Variant, 'auto'>;

function resolveVariant(variant: Variant, value: number | null): SolidVariant {
  if (variant !== 'auto') return variant;
  if (value === null) return 'cyan';
  if (value >= 80) return 'emerald';
  if (value >= 50) return 'amber';
  return 'red';
}

/**
 * Premium circular gauge with a soft gradient stroke and an inner
 * glow disc. Used on hero metrics and stat cards. Server-renderable
 * (no client hooks); reusable SVG <defs> by fixed id so multiple
 * rings on the same page share gradients and hydrate cleanly.
 */
export function PremiumProgressRing({
  value,
  size = 112,
  strokeWidth = 10,
  variant = 'auto',
  label,
  sublabel,
  className
}: Props) {
  const v = resolveVariant(variant, value);
  const gradId = VARIANT_ID[v];

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  const mainLabel = label ?? (value === null ? '—' : `${Math.round(clamped)}%`);

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={sublabel ?? mainLabel}
      >
        <defs>
          <linearGradient id="ring-grad-cyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3fd4ff" />
            <stop offset="100%" stopColor="#0ca9d8" />
          </linearGradient>
          <linearGradient id="ring-grad-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4c355" />
            <stop offset="100%" stopColor="#a87212" />
          </linearGradient>
          <linearGradient id="ring-grad-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="ring-grad-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="ring-grad-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth={strokeWidth}
        />
        {value !== null ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-[26px] font-extrabold leading-none tracking-tight text-ink-50"
          style={{ fontSize: Math.round(size * 0.26) }}
        >
          {mainLabel}
        </span>
        {sublabel ? (
          <span
            className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300"
            style={{ fontSize: Math.max(9, Math.round(size * 0.09)) }}
          >
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
