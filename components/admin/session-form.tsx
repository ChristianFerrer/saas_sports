'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { SessionFormState } from '@/app/(admin)/admin/attendance/actions';

type SessionFormProps = {
  action: (state: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  cancelHref: string;
  submitLabel: string;
};

const INITIAL: SessionFormState = {};

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function SessionForm({ action, cancelHref, submitLabel }: SessionFormProps) {
  const t = useTranslations('admin.attendance');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'dateTimeRequired'
      ? t('errors.dateTimeRequired')
      : state.error === 'durationInvalid'
        ? t('errors.durationInvalid')
        : state.error === 'duplicateSession'
          ? t('errors.duplicateSession')
          : state.error === 'insertFailed'
            ? t('errors.insertFailed')
            : state.error;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="scheduled_at_date" className="ss-label">
            {t('fields.date')}
          </label>
          <input
            id="scheduled_at_date"
            name="scheduled_at_date"
            type="date"
            required
            defaultValue={todayIsoDate()}
            className="ss-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="scheduled_at_time" className="ss-label">
            {t('fields.time')}
          </label>
          <input
            id="scheduled_at_time"
            name="scheduled_at_time"
            type="time"
            required
            defaultValue="17:00"
            className="ss-input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="duration_minutes" className="ss-label">
          {t('fields.duration')}
        </label>
        <input
          id="duration_minutes"
          name="duration_minutes"
          type="number"
          min={15}
          max={240}
          step={5}
          required
          defaultValue={60}
          className="ss-input max-w-[9rem]"
        />
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
