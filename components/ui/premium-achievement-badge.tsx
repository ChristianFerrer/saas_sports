import { Lock, Target, Trophy } from 'lucide-react';

type Tone = 'gold' | 'cyan' | 'emerald';

type Props = {
  title: string;
  /** Optional badge caption under the title (e.g. date earned). */
  sub?: string;
  icon?: 'trophy' | 'target';
  tone?: Tone;
  /** Unlocked badges glow; locked badges appear dim with a lock icon. */
  unlocked?: boolean;
  className?: string;
};

const TONE_GRAD: Record<Tone, string> = {
  gold: 'from-gold-200 via-gold-400 to-gold-600',
  cyan: 'from-cyan-300 via-cyan-500 to-cyan-600',
  emerald: 'from-emerald-300 via-emerald-500 to-emerald-700'
};

const TONE_GLOW: Record<Tone, string> = {
  gold: 'shadow-gold-glow',
  cyan: 'shadow-cyan-glow',
  emerald: ''
};

/**
 * Player-card style achievement badge. Shows a shield with the chosen
 * icon; locked badges reveal a lock overlay and desaturated look.
 */
export function PremiumAchievementBadge({
  title,
  sub,
  icon = 'trophy',
  tone = 'gold',
  unlocked = true,
  className
}: Props) {
  const Icon = icon === 'trophy' ? Trophy : Target;
  return (
    <div className={`flex flex-col items-center text-center ${className ?? ''}`}>
      <div
        className={`relative grid h-16 w-16 place-items-center rounded-2xl border border-white/10 ${
          unlocked
            ? `bg-gradient-to-br ${TONE_GRAD[tone]} ${TONE_GLOW[tone]}`
            : 'bg-white/[0.04]'
        }`}
      >
        <Icon
          size={26}
          strokeWidth={2.2}
          className={unlocked ? 'text-navy-900' : 'text-ink-400'}
          aria-hidden
        />
        {!unlocked ? (
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-navy-900 text-ink-300">
            <Lock size={12} strokeWidth={2.4} aria-hidden />
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 line-clamp-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
          unlocked ? 'text-ink-100' : 'text-ink-400'
        }`}
      >
        {title}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-300">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
