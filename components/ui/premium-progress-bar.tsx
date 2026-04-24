type Tone = 'cyan' | 'gold' | 'emerald' | 'amber' | 'red' | 'auto';

type Props = {
  label: string;
  /** 0..100. */
  value: number;
  tone?: Tone;
  /** Shown on the right of the track. Defaults to `${value}`. */
  valueLabel?: string;
  className?: string;
};

const TONE_BG: Record<Exclude<Tone, 'auto'>, string> = {
  cyan: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
  gold: 'bg-gradient-to-r from-gold-300 to-gold-500',
  emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  amber: 'bg-gradient-to-r from-amber-300 to-amber-500',
  red: 'bg-gradient-to-r from-rose-400 to-red-600'
};

function resolveTone(tone: Tone, value: number): Exclude<Tone, 'auto'> {
  if (tone !== 'auto') return tone;
  if (value >= 80) return 'emerald';
  if (value >= 50) return 'amber';
  return 'red';
}

/**
 * Horizontal premium progress bar used for categorical stats like
 * "Coordinación 72" or "Asistencia 85%". Renders a thin dark track
 * with a gradient fill and a rounded-cap terminator.
 */
export function PremiumProgressBar({
  label,
  value,
  tone = 'cyan',
  valueLabel,
  className
}: Props) {
  const safe = Math.max(0, Math.min(100, value));
  const t = resolveTone(tone, safe);
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="font-medium text-ink-100">{label}</span>
        <span className="tabular-nums text-ink-200">{valueLabel ?? safe}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${TONE_BG[t]}`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
