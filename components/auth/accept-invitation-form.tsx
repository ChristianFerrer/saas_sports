'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { AcceptInvitationFormState } from '@/app/invite/[token]/actions';

type Props = {
  action: (
    state: AcceptInvitationFormState,
    formData: FormData
  ) => Promise<AcceptInvitationFormState>;
};

const INITIAL: AcceptInvitationFormState = {};

export function AcceptInvitationForm({ action }: Props) {
  const t = useTranslations('invite');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'weakPassword'
      ? t('errors.weakPassword')
      : state.error === 'passwordsMismatch'
        ? t('errors.passwordsMismatch')
        : state.error === 'invalidToken'
          ? t('errors.invalidToken')
          : state.error === 'alreadyAccepted'
            ? t('errors.alreadyAccepted')
            : state.error === 'expired'
              ? t('errors.expired')
              : state.error;

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          {t('fields.password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password_confirm"
          className="block text-sm font-medium text-slate-700"
        >
          {t('fields.passwordConfirm')}
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton label={t('submit')} submittingLabel={t('submitting')} />

      <p className="text-xs text-slate-500">{tCommon('optional') ? null : null}</p>
    </form>
  );
}

function SubmitButton({
  label,
  submittingLabel
}: {
  label: string;
  submittingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? submittingLabel : label}
    </button>
  );
}
