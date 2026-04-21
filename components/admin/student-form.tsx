'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { StudentFormState } from '@/app/(admin)/admin/students/actions';

type GroupOption = { id: string; name: string };

type StudentFormProps = {
  action: (state: StudentFormState, formData: FormData) => Promise<StudentFormState>;
  groups: GroupOption[];
  defaults?: {
    fullName?: string;
    birthDate?: string | null;
    groupId?: string | null;
  };
  submitLabel: string;
};

const INITIAL: StudentFormState = {};

export function StudentForm({
  action,
  groups,
  defaults,
  submitLabel
}: StudentFormProps) {
  const t = useTranslations('admin.students');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'fullNameRequired' ? t('errors.fullNameRequired') : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-slate-700"
        >
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={defaults?.fullName ?? ''}
          placeholder={t('fields.fullNamePlaceholder')}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="birth_date"
          className="block text-sm font-medium text-slate-700"
        >
          {t('fields.birthDate')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={defaults?.birthDate ?? ''}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="group_id" className="block text-sm font-medium text-slate-700">
          {t('fields.group')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <select
          id="group_id"
          name="group_id"
          defaultValue={defaults?.groupId ?? ''}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t('fields.groupNone')}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/admin/students"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {tCommon('cancel')}
        </Link>
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
