'use client';

import { Check, Loader2 } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';

import {
  saveStudentSkills,
  type StudentSkillsFormState
} from '@/app/(admin)/admin/students/actions';

type SkillEntry = {
  key: string;
  label: string;
  value: number;
};

type Props = {
  studentId: string;
  entries: SkillEntry[];
  saveLabel: string;
  savedLabel: string;
};

const INITIAL: StudentSkillsFormState = {};

/**
 * Slider + number input per skill. Controlled locally for smooth
 * interaction; persists all rows in one server action call when the
 * admin hits Guardar.
 */
export function StudentSkillsEditor({
  studentId,
  entries,
  saveLabel,
  savedLabel
}: Props) {
  const bound = saveStudentSkills.bind(null, studentId);
  const [state, formAction] = useFormState(bound, INITIAL);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const e of entries) out[e.key] = e.value;
    return out;
  });

  return (
    <form action={formAction} className="space-y-4">
      <ul className="space-y-4">
        {entries.map((e) => {
          const v = values[e.key] ?? 0;
          return (
            <li key={e.key}>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`skill_${e.key}`}
                  className="text-[13px] font-medium text-ink-100"
                >
                  {e.label}
                </label>
                <span className="tabular-nums text-sm font-semibold text-gold-300">
                  {v}
                </span>
              </div>
              <input
                id={`skill_${e.key}`}
                name={`skill_${e.key}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={v}
                onChange={(evt) =>
                  setValues((curr) => ({ ...curr, [e.key]: Number(evt.target.value) }))
                }
                className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-gold-400"
              />
            </li>
          );
        })}
      </ul>

      {state.error ? (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Submit label={saveLabel} />
        {state.savedAt ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
            <Check size={16} strokeWidth={2.6} aria-hidden />
            {savedLabel}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary">
      {pending ? (
        <>
          <Loader2 size={14} strokeWidth={2.4} className="animate-spin" aria-hidden />
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
