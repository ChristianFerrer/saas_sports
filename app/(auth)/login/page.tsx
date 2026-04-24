'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { mapAuthError } from '@/lib/auth/errors';
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
      const mapped = mapAuthError(error);
      setFormError(
        mapped.key ? t(`errors.${mapped.key}`) : (mapped.fallback ?? t('errors.generic'))
      );
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
        <p>
          {t('login.noAccount')}{' '}
          <Link
            href="/signup"
            className="font-semibold text-gold-300 hover:text-gold-200"
          >
            {t('login.signupLink')}
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton intent="login" />

        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">
          <span className="flex-1 border-t border-white/10" />
          {t('or')}
          <span className="flex-1 border-t border-white/10" />
        </div>

        {queryErrorMessage && !formError ? (
          <div role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200">
            {queryErrorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="ss-label">
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
              className="ss-input"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="ss-label">
                {t('fields.password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-gold-300 hover:text-gold-200"
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
              className="ss-input"
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-red-300">
              {formError}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="ss-btn-primary w-full">
            {pending ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
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
