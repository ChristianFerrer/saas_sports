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
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="ss-label">
          {t('fields.password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password_confirm" className="ss-label">
          {t('fields.passwordConfirm')}
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="ss-input"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton label={t('submit')} submittingLabel={t('submitting')} />
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
    <button type="submit" disabled={pending} className="ss-btn-primary w-full">
      {pending ? submittingLabel : label}
    </button>
  );
}
