'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { mapAuthError } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/client';

import { createAccount } from './actions';

const KNOWN_ERRORS = new Set([
  'required_field',
  'weak_password',
  'email_taken',
  'passwords_mismatch'
]);

export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [pending, setPending] = useState(false);
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

    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);
    formData.set('full_name', fullName);
    formData.set('school_name', schoolName);

    const result = await createAccount(formData);

    if (!result.ok) {
      setFormError(
        KNOWN_ERRORS.has(result.error) ? t(`errors.${result.error}`) : t('errors.generic')
      );
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      const mapped = mapAuthError(signInError);
      setFormError(mapped.key ? t(`errors.${mapped.key}`) : mapped.fallback ?? t('errors.generic'));
      setPending(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <AuthCard
      title={t('signup.title')}
      subtitle={t('signup.subtitle')}
      footer={
        <p>
          {t('signup.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-gold-300 hover:text-gold-200">
            {t('signup.loginLink')}
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton intent="signup" />

        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">
          <span className="flex-1 border-t border-white/10" />
          {t('or')}
          <span className="flex-1 border-t border-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          id="full_name"
          label={t('fields.fullName')}
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
        />
        <Field
          id="school_name"
          label={t('fields.schoolName')}
          type="text"
          value={schoolName}
          onChange={setSchoolName}
        />
        <Field
          id="email"
          label={t('fields.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <Field
          id="password"
          label={t('fields.password')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={setPassword}
        />
        <Field
          id="password_confirm"
          label={t('fields.passwordConfirm')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={passwordConfirm}
          onChange={setPasswordConfirm}
        />

        {formError ? (
          <p role="alert" className="text-sm text-red-300">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="ss-btn-primary w-full">
          {pending ? t('signup.submitting') : t('signup.submit')}
        </button>
        </form>
      </div>
    </AuthCard>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
};

function Field({ id, label, type, value, onChange, autoComplete, minLength }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ss-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ss-input"
      />
    </div>
  );
}
