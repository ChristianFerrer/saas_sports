'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import {
  createInvitation,
  type InvitationFormState
} from '@/app/(admin)/admin/invitations/actions';

import { InvitationLink } from './invitation-link';

type StudentOption = { id: string; fullName: string };

type Props = {
  students: StudentOption[];
  submitLabel: string;
};

const INITIAL: InvitationFormState = {};

export function InvitationForm({ students, submitLabel }: Props) {
  const t = useTranslations('admin.invitations');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(createInvitation, INITIAL);
  const [role, setRole] = useState<'coach' | 'parent'>('coach');

  const errorMessage =
    state.error === 'emailInvalid'
      ? t('errors.emailInvalid')
      : state.error === 'fullNameRequired'
        ? t('errors.fullNameRequired')
        : state.error === 'roleInvalid'
          ? t('errors.roleInvalid')
          : state.error === 'studentRequired'
            ? t('errors.studentRequired')
            : state.error === 'studentNotFound'
              ? t('errors.studentNotFound')
              : state.error === 'alreadyInvited'
                ? t('errors.alreadyInvited')
                : state.error;

  if (state.createdLink) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">{t('success.title')}</p>
          <p className="mt-1 text-emerald-800">
            {state.emailStatus === 'sent'
              ? t('success.emailSent')
              : state.emailStatus === 'skipped'
                ? t('success.emailSkipped')
                : t('success.emailFailed')}
          </p>
        </div>
        <InvitationLink url={state.createdLink} label={t('copyLink')} copiedLabel={t('copied')} />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/invitations"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {t('fields.role')}
        </label>
        <div className="flex gap-2">
          {(['coach', 'parent'] as const).map((r) => (
            <label
              key={r}
              className={
                role === r
                  ? 'cursor-pointer rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800'
                  : 'cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50'
              }
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="sr-only"
              />
              {t(`roles.${r}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder={t('fields.fullNamePlaceholder')}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          {t('fields.email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {role === 'parent' ? (
        <div className="space-y-1">
          <label htmlFor="student_id" className="block text-sm font-medium text-slate-700">
            {t('fields.student')}
          </label>
          {students.length === 0 ? (
            <p className="text-sm text-amber-700">{t('fields.noStudents')}</p>
          ) : (
            <select
              id="student_id"
              name="student_id"
              required
              defaultValue=""
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>
                {t('fields.studentPlaceholder')}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/admin/invitations"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {tCommon('cancel')}
        </Link>
      </div>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
