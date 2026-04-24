'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, UserCog, Users } from 'lucide-react';
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
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 size={20} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('success.title')}</p>
            <p className="mt-1 text-emerald-800">
              {state.emailStatus === 'sent'
                ? t('success.emailSent')
                : state.emailStatus === 'skipped'
                  ? t('success.emailSkipped')
                  : t('success.emailFailed')}
            </p>
          </div>
        </div>
        <InvitationLink
          url={state.createdLink}
          label={t('copyLink')}
          copiedLabel={t('copied')}
        />
        <div>
          <Link href="/admin/invitations" className="ss-btn-secondary">
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="ss-label">{t('fields.role')}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleChip
            value="coach"
            active={role === 'coach'}
            onSelect={() => setRole('coach')}
            Icon={UserCog}
            label={t('roles.coach')}
          />
          <RoleChip
            value="parent"
            active={role === 'parent'}
            onSelect={() => setRole('parent')}
            Icon={Users}
            label={t('roles.parent')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="full_name" className="ss-label">
          {t('fields.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder={t('fields.fullNamePlaceholder')}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="ss-label">
          {t('fields.email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="ss-input"
        />
      </div>

      {role === 'parent' ? (
        <div className="space-y-1.5">
          <label htmlFor="student_id" className="ss-label">
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
              className="ss-input"
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
        <Link href="/admin/invitations" className="ss-btn-secondary">
          {tCommon('cancel')}
        </Link>
      </div>
    </form>
  );
}

function RoleChip({
  value,
  active,
  onSelect,
  Icon,
  label
}: {
  value: string;
  active: boolean;
  onSelect: () => void;
  Icon: typeof UserCog;
  label: string;
}) {
  return (
    <label
      className={
        active
          ? 'flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800'
          : 'flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50'
      }
    >
      <input
        type="radio"
        name="role"
        value={value}
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon size={18} strokeWidth={active ? 2.4 : 2} aria-hidden />
      <span>{label}</span>
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="ss-btn-primary">
      {children}
    </button>
  );
}
