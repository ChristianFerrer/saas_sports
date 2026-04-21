'use client';

import { useTransition } from 'react';

import { deleteGroup } from '@/app/(admin)/admin/groups/actions';

type Props = {
  id: string;
  confirmMessage: string;
  label: string;
};

export function DeleteGroupButton({ id, confirmMessage, label }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          void deleteGroup(id);
        });
      }}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
