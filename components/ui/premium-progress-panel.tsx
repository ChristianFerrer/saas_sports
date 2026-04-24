import { Activity, Brain, Dumbbell, HeartHandshake, Target } from 'lucide-react';

import { PremiumLineChart, type LinePoint } from './premium-line-chart';
import { PremiumProgressRing } from './premium-progress-ring';

export type ProgressSkill = {
  /** SkillKey ('technique' | 'physical' | 'tactical' | 'mental' | 'social'). */
  key: string;
  label: string;
  value: number;
};

type Props = {
  title: string;
  seasonLabel: string;
  globalScore: number | null;
  globalLabel: string;
  skills: ProgressSkill[];
  series: LinePoint[];
  encouragingLine?: string | null;
  emptyHint: string;
};

const SKILL_ICON: Record<string, typeof Activity> = {
  technique: Target,
  physical: Dumbbell,
  tactical: Activity,
  mental: Brain,
  social: HeartHandshake
};

/**
 * "Mi progreso" panel mirroring the FIFA-style mock: header + season
 * caption on top, big circular global score on the left of a grid,
 * 5 skills with icon + label + tiny gradient bar + tabular score on
 * the right, monthly trend line at the bottom and an encouraging line
 * underneath. Renders empty hints gracefully so the panel is honest
 * when no rating has been captured yet.
 */
export function PremiumProgressPanel({
  title,
  seasonLabel,
  globalScore,
  globalLabel,
  skills,
  series,
  encouragingLine,
  emptyHint
}: Props) {
  const hasSkills = skills.some((s) => s.value > 0);
  const hasSeries = series.some((p) => p.value !== null);

  return (
    <section className="ss-card-strong relative overflow-hidden p-5 sm:p-6">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[15px] font-bold uppercase tracking-[0.16em] text-ink-50">
          {title}
        </h3>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-300">
          {seasonLabel}
        </p>
      </header>

      <div className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <PremiumProgressRing
          value={globalScore}
          size={140}
          strokeWidth={12}
          variant="cyan"
          sublabel={globalLabel}
        />

        <ul className="space-y-2.5">
          {skills.map((s) => {
            const Icon = SKILL_ICON[s.key] ?? Target;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-cyan-300">
                  <Icon size={14} strokeWidth={2.2} aria-hidden />
                </span>
                <span className="w-20 shrink-0 text-[13px] font-medium text-ink-100">
                  {s.label}
                </span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                    style={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
                  />
                </span>
                <span className="w-7 shrink-0 text-right font-display text-sm font-bold tabular-nums text-ink-50">
                  {s.value}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5">
        {hasSeries ? (
          <PremiumLineChart data={series} height={140} variant="cyan" />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-ink-300">
            {emptyHint}
          </div>
        )}
      </div>

      {encouragingLine && hasSkills ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
          <span aria-hidden>📈</span>
          <span>{encouragingLine}</span>
        </p>
      ) : null}
    </section>
  );
}
