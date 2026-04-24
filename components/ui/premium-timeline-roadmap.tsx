import { ChevronRight, Lock, Trophy } from 'lucide-react';

export type RoadmapStep = {
  label: string;
  sub?: string;
  state: 'done' | 'current' | 'upcoming' | 'dream';
};

type Props = {
  steps: RoadmapStep[];
  /** Optional heading + caption */
  title?: string;
  caption?: string;
  className?: string;
};

/**
 * Horizontal scrollable roadmap that shows formative progression
 * across groups/categories. States:
 *  - done: solid tick, muted text
 *  - current: glowing gold shield, big label
 *  - upcoming: outlined grey shield with lock
 *  - dream: final trophy step ("futuro / sueños")
 */
export function PremiumTimelineRoadmap({ steps, title, caption, className }: Props) {
  return (
    <section className={`ss-card overflow-hidden p-4 sm:p-5 ${className ?? ''}`}>
      {title ? (
        <header className="mb-3">
          <p className="ss-kicker">{title}</p>
          {caption ? (
            <p className="mt-0.5 text-sm text-ink-200">{caption}</p>
          ) : null}
        </header>
      ) : null}

      <ol className="flex items-stretch gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={`${step.label}-${i}`} className="flex items-center gap-2">
              <StepCard step={step} />
              {!isLast ? (
                <ChevronRight
                  size={18}
                  strokeWidth={2.2}
                  className="shrink-0 text-ink-400"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepCard({ step }: { step: RoadmapStep }) {
  const isCurrent = step.state === 'current';
  const isDone = step.state === 'done';
  const isDream = step.state === 'dream';

  return (
    <div
      className={
        isCurrent
          ? 'relative flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-gold-400/40 bg-gradient-to-br from-gold-500/20 to-gold-700/15 px-2 text-center shadow-gold-glow'
          : isDream
            ? 'flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-navy-800/40 px-2 text-center'
            : isDone
              ? 'flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-400/20 bg-white/[0.04] px-2 text-center'
              : 'flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-2 text-center'
      }
    >
      <span
        className={
          isCurrent
            ? 'mb-1 grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-navy-900 shadow-gold-glow'
            : isDream
              ? 'mb-1 grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-600 text-navy-900'
              : isDone
                ? 'mb-1 grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300'
                : 'mb-1 grid h-8 w-8 place-items-center rounded-xl bg-white/[0.05] text-ink-400'
        }
        aria-hidden
      >
        {isDream || isCurrent ? (
          <Trophy size={16} strokeWidth={2.4} />
        ) : isDone ? (
          <Trophy size={16} strokeWidth={2.4} />
        ) : (
          <Lock size={14} strokeWidth={2.4} />
        )}
      </span>
      <p
        className={
          isCurrent
            ? 'text-[12px] font-bold uppercase tracking-[0.08em] text-gold-200'
            : isDream
              ? 'text-[12px] font-bold uppercase tracking-[0.08em] text-cyan-300'
              : isDone
                ? 'text-[12px] font-bold uppercase tracking-[0.08em] text-ink-200'
                : 'text-[12px] font-bold uppercase tracking-[0.08em] text-ink-400'
        }
      >
        {step.label}
      </p>
      {step.sub ? (
        <p
          className={
            isCurrent || isDream
              ? 'mt-0.5 text-[10px] text-ink-200'
              : 'mt-0.5 text-[10px] text-ink-400'
          }
        >
          {step.sub}
        </p>
      ) : null}
      {isCurrent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-200 to-gold-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-navy-900"
        >
          Hoy
        </span>
      ) : null}
    </div>
  );
}
