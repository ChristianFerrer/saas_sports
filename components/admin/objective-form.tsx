'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import type { ObjectiveFormState } from '@/app/(admin)/admin/groups/[id]/objectives/actions';

type Props = {
  action: (state: ObjectiveFormState, formData: FormData) => Promise<ObjectiveFormState>;
  defaults?: {
    title?: string;
    description?: string | null;
  };
  cancelHref: string;
  submitLabel: string;
};

const INITIAL: ObjectiveFormState = {};

export function ObjectiveForm({ action, defaults, cancelHref, submitLabel }: Props) {
  const t = useTranslations('admin.objectives');
  const tCommon = useTranslations('common');
  const [state, formAction] = useFormState(action, INITIAL);

  const errorMessage =
    state.error === 'titleRequired'
      ? t('errors.titleRequired')
      : state.error === 'insertFailed'
        ? t('errors.insertFailed')
        : state.error;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="title" className="ss-label">
          {t('fields.title')}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={defaults?.title ?? ''}
          placeholder={t('fields.titlePlaceholder')}
          className="ss-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="ss-label">
          {t('fields.description')}{' '}
          <span className="text-slate-400">{tCommon('optional')}</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={400}
          defaultValue={defaults?.description ?? ''}
          placeholder={t('fields.descriptionPlaceholder')}
          className="ss-input resize-y"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="ss-btn-secondary">
          {tCommon('cancel')}
        </Link>
      </div>
    </form>
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
