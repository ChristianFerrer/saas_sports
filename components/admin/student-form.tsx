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
    position?: string | null;
    dominantFoot?: 'left' | 'right' | 'both' | null;
    dorsalNumber?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    photoUrl?: string | null;
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

      {/* Player card fields */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <label className="ss-label">{t('fields.playerCard')}</label>
          <p className="text-xs text-ink-300">{t('fields.playerCardHint')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="dorsal_number" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
              {t('fields.dorsal')}
            </label>
            <input
              id="dorsal_number"
              name="dorsal_number"
              type="number"
              min={1}
              max={99}
              step={1}
              defaultValue={defaults?.dorsalNumber ?? ''}
              placeholder="—"
              className="ss-input"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="position" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
              {t('fields.position')}
            </label>
            <input
              id="position"
              name="position"
              type="text"
              maxLength={30}
              defaultValue={defaults?.position ?? ''}
              placeholder={t('fields.positionPlaceholder')}
              className="ss-input"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="dominant_foot" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
              {t('fields.dominantFoot')}
            </label>
            <select
              id="dominant_foot"
              name="dominant_foot"
              defaultValue={defaults?.dominantFoot ?? ''}
              className="ss-input"
            >
              <option value="">{t('fields.dominantFootNone')}</option>
              <option value="right">{t('fields.dominantFootRight')}</option>
              <option value="left">{t('fields.dominantFootLeft')}</option>
              <option value="both">{t('fields.dominantFootBoth')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="height_cm" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
                {t('fields.height')}
              </label>
              <input
                id="height_cm"
                name="height_cm"
                type="number"
                min={1}
                max={259}
                step={1}
                defaultValue={defaults?.heightCm ?? ''}
                placeholder="cm"
                className="ss-input"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="weight_kg" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
                {t('fields.weight')}
              </label>
              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min={1}
                max={299}
                step={0.1}
                defaultValue={defaults?.weightKg ?? ''}
                placeholder="kg"
                className="ss-input"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="photo_url" className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
            {t('fields.photoUrl')}{' '}
            <span className="normal-case text-ink-400">{tCommon('optional')}</span>
          </label>
          <input
            id="photo_url"
            name="photo_url"
            type="url"
            defaultValue={defaults?.photoUrl ?? ''}
            placeholder="https://..."
            className="ss-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="ss-label">{t('fields.enrollment')}</label>
          <p className="text-xs text-ink-300">{t('fields.enrollmentHint')}</p>
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
