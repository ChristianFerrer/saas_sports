'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { mapAuthError } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      const mapped = mapAuthError(error);
      setFormError(mapped.key ? t(`errors.${mapped.key}`) : mapped.fallback ?? t('errors.generic'));
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  return (
    <AuthCard
      title={t('forgot.title')}
      subtitle={t('forgot.subtitle')}
      footer={
        <Link
          href="/login"
          className="font-medium text-gold-300 hover:text-gold-200"
        >
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <div role="status" className="rounded-xl bg-emerald-500/15 p-4 text-sm text-emerald-200">
          {t('forgot.sent', { email })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="ss-label">
              {t('fields.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ss-input"
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-red-300">
              {formError}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="ss-btn-primary w-full">
            {pending ? t('forgot.submitting') : t('forgot.submit')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
