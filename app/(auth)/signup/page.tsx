'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
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
      setFormError(t('errors.generic'));
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
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            {t('signup.loginLink')}
          </Link>
        </p>
      }
    >
      <GoogleButton intent="signup" />

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="flex-1 border-t border-slate-200" />
        {t('or')}
        <span className="flex-1 border-t border-slate-200" />
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
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>
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
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
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
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
