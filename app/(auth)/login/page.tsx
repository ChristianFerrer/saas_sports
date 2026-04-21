'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const KNOWN_ERROR_KEYS = ['no_profile', 'auth_callback_failed'] as const;
type KnownErrorKey = (typeof KNOWN_ERROR_KEYS)[number];

function isKnownErrorKey(value: string | null): value is KnownErrorKey {
  return value !== null && (KNOWN_ERROR_KEYS as readonly string[]).includes(value);
}

function LoginForm() {
  const t = useTranslations('login');
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const queryErrorParam = searchParams.get('error');
  const queryErrorMessage = queryErrorParam
    ? isKnownErrorKey(queryErrorParam)
      ? t(`errors.${queryErrorParam}`)
      : t('errors.generic')
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }

    setStatus('sent');
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-600">{t('subtitle')}</p>
      </header>

      {status === 'sent' ? (
        <div
          role="status"
          className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {t('sent', { email })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {queryErrorMessage && status !== 'error' && (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-800"
            >
              {queryErrorMessage}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {status === 'error' && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sending' ? t('sending') : t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
