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
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="ss-label">
          {t('fields.name')}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          placeholder={t('fields.namePlaceholder')}
          className="ss-input"
        />
      </div>

      {showCoach ? (
        <div className="space-y-1.5">
          <label htmlFor="coach_id" className="ss-label">
            {t('fields.coach')}{' '}
            <span className="text-slate-400">{tCommon('optional')}</span>
          </label>
          <select
            id="coach_id"
            name="coach_id"
            defaultValue={defaultCoachId ?? ''}
            className="ss-input"
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
        <Link href="/admin/groups" className="ss-btn-secondary">
          {tCommon('cancel')}
        </Link>
      </div>
    </form>
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
