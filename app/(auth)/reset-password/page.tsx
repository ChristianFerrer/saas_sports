'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (password !== passwordConfirm) {
      setFormError(t('errors.passwords_mismatch'));
      return;
    }
    if (password.length < 8) {
      setFormError(t('errors.weak_password'));
      return;
    }

    setPending(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(t('errors.generic'));
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);

    setTimeout(() => {
      router.replace('/');
      router.refresh();
    }, 1200);
  }

  return (
    <AuthCard title={t('reset.title')} subtitle={t('reset.subtitle')}>
      {success ? (
        <div
          role="status"
          className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {t('reset.success')}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t('fields.newPassword')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
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
            {pending ? t('reset.submitting') : t('reset.submit')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
