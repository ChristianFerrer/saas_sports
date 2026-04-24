'use client';

import { Check, Loader2, Target } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

import { toggleStudentObjective } from '@/app/(admin)/admin/students/actions';

export type ObjectiveItem = {
  id: string;
  title: string;
  description: string | null;
  achieved: boolean;
  achievedAt: string | null;
};

type Props = {
  studentId: string;
  objectives: ObjectiveItem[];
  toggleHint: string;
};

export function StudentObjectivesList({
  studentId,
  objectives,
  toggleHint
}: Props) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<ObjectiveItem[], string>(
    objectives,
    (state, toggledId) =>
      state.map((o) =>
        o.id === toggledId
          ? {
              ...o,
              achieved: !o.achieved,
              achievedAt: !o.achieved ? new Date().toISOString() : null
            }
          : o
      )
  );

  function onToggle(item: ObjectiveItem) {
    startTransition(async () => {
      setOptimistic(item.id);
      await toggleStudentObjective(studentId, item.id, !item.achieved);
    });
  }

  return (
    <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
      {optimistic.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            onClick={() => onToggle(o)}
            disabled={pending}
            aria-pressed={o.achieved}
            title={toggleHint}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] disabled:cursor-wait"
          >
            <span
              aria-hidden
              className={
                o.achieved
                  ? 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-navy-900 shadow-gold-glow'
                  : 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-300'
              }
            >
              {o.achieved ? (
                <Check size={16} strokeWidth={3} />
              ) : pending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Target size={14} strokeWidth={2.4} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={
                  o.achieved
                    ? 'truncate font-semibold text-ink-50'
                    : 'truncate font-medium text-ink-100'
                }
              >
                {o.title}
              </p>
              {o.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-300">
                  {o.description}
                </p>
              ) : null}
            </div>
            {o.achieved ? (
              <span className="ss-pill-gold shrink-0 self-center">Logrado</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
