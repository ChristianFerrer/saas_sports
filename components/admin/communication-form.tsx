'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import {
  sendCommunication,
  type CommunicationFormState
} from '@/app/(admin)/admin/communications/actions';

type GroupOption = { id: string; name: string };

type Props = {
  groups: GroupOption[];
  submitLabel: string;
};

const INITIAL: CommunicationFormState = {};

export function CommunicationForm({ groups, submitLabel }: Props) {
  const t = useTranslations('admin.communications');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(sendCommunication, INITIAL);
  const [audience, setAudience] = useState<'school' | 'group'>('school');

  const errorMessage =
    state.error === 'subjectRequired'
      ? t('errors.subjectRequired')
      : state.error === 'contentRequired'
        ? t('errors.contentRequired')
        : state.error === 'audienceInvalid'
          ? t('errors.audienceInvalid')
          : state.error === 'groupRequired'
            ? t('errors.groupRequired')
            : state.error === 'noRecipients'
              ? t('errors.noRecipients')
              : state.error === 'insertFailed'
                ? t('errors.insertFailed')
                : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {t('fields.audience')}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['school', 'group'] as const).map((a) => (
            <label
              key={a}
              className={
                audience === a
                  ? 'cursor-pointer rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800'
                  : 'cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50'
              }
            >
              <input
                type="radio"
                name="audience"
                value={a}
                checked={audience === a}
                onChange={() => setAudience(a)}
                className="sr-only"
              />
              {t(`audiences.${a}`)}
            </label>
          ))}
        </div>
      </div>

      {audience === 'group' ? (
        <div className="space-y-1">
          <label htmlFor="group_id" className="block text-sm font-medium text-slate-700">
            {t('fields.group')}
          </label>
          {groups.length === 0 ? (
            <p className="text-sm text-amber-700">{t('fields.noGroups')}</p>
          ) : (
            <select
              id="group_id"
              name="group_id"
              required
              defaultValue=""
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>
                {t('fields.groupPlaceholder')}
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
          {t('fields.subject')}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">
          {t('fields.content')}
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/admin/communications"
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
