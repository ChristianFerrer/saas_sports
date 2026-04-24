'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Building2, Layers } from 'lucide-react';
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
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="ss-label">{t('fields.audience')}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          <AudienceChip
            value="school"
            active={audience === 'school'}
            onSelect={() => setAudience('school')}
            Icon={Building2}
            label={t('audiences.school')}
          />
          <AudienceChip
            value="group"
            active={audience === 'group'}
            onSelect={() => setAudience('group')}
            Icon={Layers}
            label={t('audiences.group')}
          />
        </div>
      </div>

      {audience === 'group' ? (
        <div className="space-y-1.5">
          <label htmlFor="group_id" className="ss-label">
            {t('fields.group')}
          </label>
          {groups.length === 0 ? (
            <p className="text-sm text-amber-300">{t('fields.noGroups')}</p>
          ) : (
            <select
              id="group_id"
              name="group_id"
              required
              defaultValue=""
              className="ss-input"
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

      <div className="space-y-1.5">
        <label htmlFor="subject" className="ss-label">
          {t('fields.subject')}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="ss-label">
          {t('fields.content')}
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          className="ss-input resize-y"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/communications" className="ss-btn-secondary">
          {tCommon('cancel')}
        </Link>
      </div>
    </form>
  );
}

function AudienceChip({
  value,
  active,
  onSelect,
  Icon,
  label
}: {
  value: string;
  active: boolean;
  onSelect: () => void;
  Icon: typeof Building2;
  label: string;
}) {
  return (
    <label
      className={
        active
          ? 'flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2.5 text-sm font-medium text-emerald-200'
          : 'flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm text-ink-100 hover:bg-white/[0.03]'
      }
    >
      <input
        type="radio"
        name="audience"
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
