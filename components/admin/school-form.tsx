'use client';

import { Check } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import {
  updateSchool,
  type SchoolFormState
} from '@/app/(admin)/admin/settings/actions';

type ProfileOption = {
  userId: string;
  fullName: string;
  role: 'admin' | 'coach';
};

type Props = {
  defaults: {
    name: string;
    contactPhone: string | null;
    contactEmail: string | null;
    commsResponsible: string | null;
  };
  profiles: ProfileOption[];
};

const INITIAL: SchoolFormState = {};

export function SchoolForm({ defaults, profiles }: Props) {
  const t = useTranslations('admin.settings');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(updateSchool, INITIAL);

  const errorMessage =
    state.error === 'nameRequired'
      ? t('errors.nameRequired')
      : state.error === 'emailInvalid'
        ? t('errors.emailInvalid')
        : state.error === 'commsResponsibleInvalid'
          ? t('errors.commsResponsibleInvalid')
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
          defaultValue={defaults.name}
          className="ss-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="contact_phone" className="ss-label">
            {t('fields.contactPhone')}{' '}
            <span className="text-ink-400">{tCommon('optional')}</span>
          </label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={defaults.contactPhone ?? ''}
            placeholder="+34 600 000 000"
            className="ss-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact_email" className="ss-label">
            {t('fields.contactEmail')}{' '}
            <span className="text-ink-400">{tCommon('optional')}</span>
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={defaults.contactEmail ?? ''}
            placeholder="contacto@escuela.com"
            className="ss-input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comms_responsible" className="ss-label">
          {t('fields.commsResponsible')}{' '}
          <span className="text-ink-400">{tCommon('optional')}</span>
        </label>
        <p className="text-xs text-ink-300">{t('fields.commsResponsibleHint')}</p>
        <select
          id="comms_responsible"
          name="comms_responsible"
          defaultValue={defaults.commsResponsible ?? ''}
          className="ss-input"
        >
          <option value="">{t('fields.commsResponsibleNone')}</option>
          {profiles.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.fullName} · {t(`roles.${p.role}`)}
            </option>
          ))}
        </select>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={tCommon('save')} />
        {state.savedAt ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-300">
            <Check size={16} strokeWidth={2.6} aria-hidden />
            {t('saved')}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary">
      {label}
    </button>
  );
}
