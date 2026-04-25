import { Compass } from 'lucide-react';

import { PremiumProgressBar } from './premium-progress-bar';

type Item = {
  key: string;
  label: string;
  /** 0-100 */
  value: number;
};

type Props = {
  kicker: string;
  title: string;
  hint?: string;
  items: Item[];
};

const TONES: Array<'gold' | 'cyan' | 'emerald' | 'amber'> = [
  'cyan',
  'emerald',
  'gold',
  'amber'
];

/**
 * Three soft-skill bars (independence, social confidence, follows
 * instructions). Reuses PremiumProgressBar so it inherits the look &
 * feel of the existing categorical bars block.
 */
export function SoftSkillsPanel({ kicker, title, hint, items }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="ss-card p-4 sm:p-5">
      <div className="mb-3">
        <p className="ss-kicker flex items-center gap-1.5 text-gold-300">
          <Compass size={12} strokeWidth={2.4} aria-hidden />
          {kicker}
        </p>
        <h3 className="mt-0.5 text-[15px] font-bold text-ink-50">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <PremiumProgressBar
            key={it.key}
            label={it.label}
            value={it.value}
            tone={TONES[i % TONES.length]}
          />
        ))}
      </div>
      {hint ? <p className="mt-3 text-[11px] text-ink-400">{hint}</p> : null}
    </section>
  );
}
