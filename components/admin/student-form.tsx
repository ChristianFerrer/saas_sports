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
    enrolledAt?: string | null;
    leftAt?: string | null;
  };
  cancelHref?: string;
  submitLabel: string;
};

const INITIAL: StudentFormState = {};

export function StudentForm({
  action,
  groups,
  defaults,
  cancelHref = '/admin/students',
  submitLabel
}: StudentFormProps) {
  const t = useTranslations('admin.students');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'fullNameRequired'
      ? t('errors.fullNameRequired')
      : state.error === 'dateInvalid'
        ? t('errors.dateInvalid')
        : state.error === 'dateRangeInvalid'
          ? t('errors.dateRangeInvalid')
          : state.error;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="ss-label">
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={defaults?.fullName ?? ''}
          placeholder={t('fields.fullNamePlaceholder')}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="birth_date" className="ss-label">
          {t('fields.birthDate')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={defaults?.birthDate ?? ''}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="group_id" className="ss-label">
          {t('fields.group')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <select
          id="group_id"
          name="group_id"
          defaultValue={defaults?.groupId ?? ''}
          className="ss-input"
        >
          <option value="">{t('fields.groupNone')}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="ss-label">{t('fields.enrollment')}</label>
          <p className="text-xs text-slate-500">{t('fields.enrollmentHint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label
              htmlFor="enrolled_at"
              className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
            >
              {t('fields.enrolledAt')}
            </label>
            <input
              id="enrolled_at"
              name="enrolled_at"
              type="date"
              defaultValue={defaults?.enrolledAt ?? ''}
              className="ss-input"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="left_at"
              className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
            >
              {t('fields.leftAt')}{' '}
              <span className="text-slate-400 normal-case">{tCommon('optional')}</span>
            </label>
            <input
              id="left_at"
              name="left_at"
              type="date"
              defaultValue={defaults?.leftAt ?? ''}
              className="ss-input"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="ss-btn-secondary">
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
