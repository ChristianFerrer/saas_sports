'use client';

import { Check } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { AttendanceFormState } from '@/app/(admin)/admin/attendance/actions';

type StudentEntry = {
  id: string;
  fullName: string;
  present: boolean;
  notes: string;
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

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary">
      {children}
    </button>
  );
}
