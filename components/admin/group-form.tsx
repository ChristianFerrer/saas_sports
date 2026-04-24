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
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  defaultDisplayOrder?: number;
  coaches?: CoachOption[];
  showSchedule?: boolean;
  showCoach?: boolean;
  showCycle?: boolean;
  showOrder?: boolean;
  submitLabel: string;
};

const INITIAL: GroupFormState = {};

export function GroupForm({
  action,
  defaultName = '',
  defaultSchedule = [],
  defaultCoachId = null,
  defaultStartDate = null,
  defaultEndDate = null,
  defaultDisplayOrder = 0,
  coaches = [],
  showSchedule = false,
  showCoach = false,
  showCycle = false,
  showOrder = false,
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
        : state.error === 'dateInvalid'
          ? t('errors.dateInvalid')
          : state.error === 'dateRangeInvalid'
            ? t('errors.dateRangeInvalid')
            : state.error === 'orderInvalid'
              ? t('errors.orderInvalid')
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

      {showCycle ? (
        <div className="space-y-2">
          <div className="space-y-0.5">
            <label className="ss-label">{t('fields.cycle')}</label>
            <p className="text-xs text-slate-500">{t('fields.cycleHint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="start_date"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
              >
                {t('fields.startDate')}
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={defaultStartDate ?? ''}
                className="ss-input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="end_date"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
              >
                {t('fields.endDate')}
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={defaultEndDate ?? ''}
                className="ss-input"
              />
            </div>
          </div>
        </div>
      ) : null}

      {showOrder ? (
        <div className="space-y-1.5">
          <label htmlFor="display_order" className="ss-label">
            {t('fields.displayOrder')}
          </label>
          <p className="text-xs text-ink-300">{t('fields.displayOrderHint')}</p>
          <input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            max={9999}
            step={1}
            defaultValue={defaultDisplayOrder}
            className="ss-input max-w-[10rem]"
          />
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
