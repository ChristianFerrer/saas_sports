'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { SessionFormState } from '@/app/(admin)/admin/attendance/actions';

type SessionFormProps = {
  action: (state: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  cancelHref: string;
  submitLabel: string;
  defaults?: {
    dateIso?: string;
    timeHHMM?: string;
    durationMinutes?: number;
    status?: 'scheduled' | 'held' | 'cancelled';
    notes?: string | null;
  };
};

const INITIAL: SessionFormState = {};

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function SessionForm({
  action,
  cancelHref,
  submitLabel,
  defaults
}: SessionFormProps) {
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
            defaultValue={defaults?.dateIso ?? todayIsoDate()}
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
            defaultValue={defaults?.timeHHMM ?? '17:00'}
            className="ss-input"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="duration_minutes" className="ss-label">
            {t('fields.duration')}
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            required
            defaultValue={String(defaults?.durationMinutes ?? 60)}
            className="ss-input tabular-nums"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="ss-label">
            {t('fields.status')}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'scheduled'}
            className="ss-input"
          >
            <option value="scheduled">{t('status.scheduled')}</option>
            <option value="held">{t('status.held')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="ss-label">
          {t('fields.sessionNotes')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <p className="text-xs text-slate-500">{t('fields.sessionNotesHint')}</p>
        <input
          id="notes"
          name="notes"
          type="text"
          maxLength={140}
          defaultValue={defaults?.notes ?? ''}
          placeholder={t('fields.sessionNotesPlaceholder')}
          className="ss-input"
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
