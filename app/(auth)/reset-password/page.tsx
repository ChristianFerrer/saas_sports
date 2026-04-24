'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { mapAuthError } from '@/lib/auth/errors';
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
      const mapped = mapAuthError(error);
      setFormError(mapped.key ? t(`errors.${mapped.key}`) : mapped.fallback ?? t('errors.generic'));
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
        <div role="status" className="rounded-xl bg-emerald-500/15 p-4 text-sm text-emerald-200">
          {t('reset.success')}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="password" className="ss-label">
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
              className="ss-input"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password_confirm" className="ss-label">
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
              className="ss-input"
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-red-300">
              {formError}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="ss-btn-primary w-full">
            {pending ? t('reset.submitting') : t('reset.submit')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
