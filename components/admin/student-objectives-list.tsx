'use client';

import { Check, Circle, Loader2 } from 'lucide-react';
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
    <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
      {optimistic.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            onClick={() => onToggle(o)}
            disabled={pending}
            aria-pressed={o.achieved}
            title={toggleHint}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-wait"
          >
            <span
              aria-hidden
              className={
                o.achieved
                  ? 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white'
                  : 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-slate-300 text-transparent'
              }
            >
              {o.achieved ? (
                <Check size={15} strokeWidth={3} />
              ) : pending ? (
                <Loader2 size={14} className="animate-spin text-slate-400" />
              ) : (
                <Circle size={0} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={
                  o.achieved
                    ? 'truncate font-semibold text-slate-900'
                    : 'truncate font-medium text-slate-700'
                }
              >
                {o.title}
              </p>
              {o.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                  {o.description}
                </p>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
