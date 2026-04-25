'use client';

import { Check, Frown, Meh, Smile } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { AttendanceFormState } from '@/app/(admin)/admin/attendance/actions';

type Mood = 0 | 1 | 2 | null;

type StudentEntry = {
  id: string;
  fullName: string;
  present: boolean;
  notes: string;
  mood: Mood;
};

type AttendanceSheetProps = {
  action: (
    state: AttendanceFormState,
    formData: FormData
  ) => Promise<AttendanceFormState>;
  students: StudentEntry[];
  submitLabel: string;
  savedLabel: string;
};

const INITIAL: AttendanceFormState = {};

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function AttendanceSheet({
  action,
  students,
  submitLabel,
  savedLabel
}: AttendanceSheetProps) {
  const t = useTranslations('admin.attendance');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'noStudents' ? t('errors.noStudents') : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
        {students.map((s) => (
          <li key={s.id} className="p-3 sm:p-4">
            <label
              htmlFor={`present_${s.id}`}
              className="flex items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.04] text-sm font-semibold text-ink-100">
                {initialsOf(s.fullName) || '·'}
              </span>
              <span className="flex-1 text-sm font-medium text-ink-50">
                {s.fullName}
              </span>
              <PresenceToggle id={s.id} defaultChecked={s.present} />
            </label>
            <input
              type="text"
              name={`notes_${s.id}`}
              defaultValue={s.notes}
              placeholder={t('fields.notesPlaceholder')}
              className="mt-2.5 block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-50 placeholder:text-ink-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <MoodPicker
              id={s.id}
              defaultValue={s.mood}
              legend={t('fields.moodLegend')}
              labels={{
                happy: t('mood.happy'),
                neutral: t('mood.neutral'),
                sad: t('mood.sad'),
                clear: t('mood.clear')
              }}
            />
          </li>
        ))}
      </ul>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div
        className="sticky bottom-4 flex items-center gap-3 rounded-2xl bg-white/80 p-2 shadow-pop backdrop-blur"
        style={{ backdropFilter: 'saturate(180%) blur(14px)' }}
      >
        <SubmitButton>{submitLabel}</SubmitButton>
        {state.savedAt ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-300">
            <Check size={16} strokeWidth={2.6} aria-hidden />
            {savedLabel}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function PresenceToggle({ id, defaultChecked }: { id: string; defaultChecked: boolean }) {
  return (
    <span className="relative inline-block h-[30px] w-[52px] shrink-0">
      <input
        id={`present_${id}`}
        name={`present_${id}`}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500/15 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40 peer-focus-visible:ring-offset-2"
      />
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow transition peer-checked:translate-x-[22px]"
      />
    </span>
  );
}

function MoodPicker({
  id,
  defaultValue,
  legend,
  labels
}: {
  id: string;
  defaultValue: Mood;
  legend: string;
  labels: { happy: string; neutral: string; sad: string; clear: string };
}) {
  const [value, setValue] = useState<Mood>(defaultValue);
  const options: Array<{ v: 0 | 1 | 2; label: string; icon: ReactIcon }> = [
    { v: 2, label: labels.happy, icon: Smile },
    { v: 1, label: labels.neutral, icon: Meh },
    { v: 0, label: labels.sad, icon: Frown }
  ];
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
        {legend}
      </span>
      <input type="hidden" name={`mood_${id}`} value={value == null ? '' : String(value)} />
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.v;
          const cls = active
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-navy-900 shadow-gold-glow'
            : 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-300 hover:text-ink-100';
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => setValue(active ? null : opt.v)}
              className={cls}
              aria-label={opt.label}
              title={opt.label}
            >
              <Icon size={14} strokeWidth={2.4} aria-hidden />
            </button>
          );
        })}
        {value != null ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="ml-1 text-[10px] font-medium text-ink-400 hover:text-ink-200"
          >
            {labels.clear}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type ReactIcon = typeof Smile;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary">
      {children}
    </button>
  );
}
