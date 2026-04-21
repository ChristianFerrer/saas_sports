'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
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
      setFormError(t('errors.generic'));
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
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <div
          role="status"
          className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {t('forgot.sent', { email })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              {t('fields.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {pending ? t('forgot.submitting') : t('forgot.submit')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
