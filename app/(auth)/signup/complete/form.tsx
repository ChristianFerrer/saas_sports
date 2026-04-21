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
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={defaultFullName}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="school_name" className="block text-sm font-medium text-slate-700">
          {t('fields.schoolName')}
        </label>
        <input
          id="school_name"
          name="school_name"
          type="text"
          required
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t('submitting') : t('submit')}
    </button>
  );
}
