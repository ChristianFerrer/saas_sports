'use client';

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

export function AttendanceSheet({
  action,
  students,
  submitLabel,
  savedLabel
}: AttendanceSheetProps) {
  const t = useTranslations('admin.attendance');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'noStudents'
      ? t('errors.noStudents')
      : state.error;

  return (
    <form action={formAction} className="space-y-3">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {students.map((s) => (
          <li key={s.id} className="p-3">
            <div className="flex items-center gap-3">
              <input
                id={`present_${s.id}`}
                name={`present_${s.id}`}
                type="checkbox"
                defaultChecked={s.present}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor={`present_${s.id}`}
                className="flex-1 text-sm font-medium text-slate-900"
              >
                {s.fullName}
              </label>
            </div>
            <input
              type="text"
              name={`notes_${s.id}`}
              defaultValue={s.notes}
              placeholder={t('fields.notesPlaceholder')}
              className="mt-2 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </li>
        ))}
      </ul>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        {state.savedAt ? (
          <span className="text-sm text-emerald-700">{savedLabel}</span>
        ) : null}
      </div>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
