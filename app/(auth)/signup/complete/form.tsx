'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import { completeSignup, type CompleteSignupState } from './actions';

const INITIAL: CompleteSignupState = {};

const KNOWN_ERRORS = new Set(['required_field']);

export function CompleteSignupForm({ defaultFullName }: { defaultFullName: string }) {
  const t = useTranslations('auth');
  const [state, formAction] = useFormState(completeSignup, INITIAL);

  const errorMessage = state.error
    ? KNOWN_ERRORS.has(state.error)
      ? t(`errors.${state.error}`)
      : t('errors.generic')
    : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="ss-label">
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={defaultFullName}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="school_name" className="ss-label">
          {t('fields.schoolName')}
        </label>
        <input
          id="school_name"
          name="school_name"
          type="text"
          required
          className="ss-input"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const t = useTranslations('auth.signup.complete');
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary w-full">
      {pending ? t('submitting') : t('submit')}
    </button>
  );
}
