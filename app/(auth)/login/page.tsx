'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { createClient } from '@/lib/supabase/client';

const KNOWN_ERROR_KEYS = [
  'no_profile',
  'auth_callback_failed',
  'oauth_failed'
] as const;
type KnownErrorKey = (typeof KNOWN_ERROR_KEYS)[number];

function isKnownErrorKey(value: string | null): value is KnownErrorKey {
  return value !== null && (KNOWN_ERROR_KEYS as readonly string[]).includes(value);
}

function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const queryErrorParam = searchParams.get('error');
  const queryErrorMessage = queryErrorParam
    ? isKnownErrorKey(queryErrorParam)
      ? t(`errors.${queryErrorParam}`)
      : t('errors.generic')
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const isCredError = /invalid.*credentials|invalid.*password/i.test(error.message);
      setFormError(t(isCredError ? 'errors.invalid_credentials' : 'errors.generic'));
      setPending(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <AuthCard
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          <p>
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
              {t('login.signupLink')}
            </Link>
          </p>
        </>
      }
    >
      <GoogleButton intent="login" />

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="flex-1 border-t border-slate-200" />
        {t('or')}
        <span className="flex-1 border-t border-slate-200" />
      </div>

      {queryErrorMessage && !formError ? (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {queryErrorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t('fields.password')}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              {t('login.forgot')}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {formError ? (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
