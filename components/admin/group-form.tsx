'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { GroupFormState } from '@/app/(admin)/admin/groups/actions';
import type { GroupScheduleEntry } from '@/types/database';

import { ScheduleEditor } from './schedule-editor';

type CoachOption = { id: string; fullName: string };

type GroupFormProps = {
  action: (state: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  defaultName?: string;
  defaultSchedule?: GroupScheduleEntry[];
  defaultCoachId?: string | null;
  coaches?: CoachOption[];
  showSchedule?: boolean;
  showCoach?: boolean;
  submitLabel: string;
};

const INITIAL: GroupFormState = {};

export function GroupForm({
  action,
  defaultName = '',
  defaultSchedule = [],
  defaultCoachId = null,
  coaches = [],
  showSchedule = false,
  showCoach = false,
  submitLabel
}: GroupFormProps) {
  const t = useTranslations('admin.groups');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'nameRequired'
      ? t('errors.nameRequired')
      : state.error === 'scheduleInvalid'
        ? t('errors.scheduleInvalid')
        : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          {t('fields.name')}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          placeholder={t('fields.namePlaceholder')}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {showCoach ? (
        <div className="space-y-1">
          <label htmlFor="coach_id" className="block text-sm font-medium text-slate-700">
            {t('fields.coach')}{' '}
            <span className="text-slate-400">{tCommon('optional')}</span>
          </label>
          <select
            id="coach_id"
            name="coach_id"
            defaultValue={defaultCoachId ?? ''}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('fields.coachNone')}</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showSchedule ? <ScheduleEditor defaultSchedule={defaultSchedule} /> : null}

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/admin/groups"
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
