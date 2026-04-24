'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

import { deleteCommunication } from '@/app/(admin)/admin/communications/actions';

type Props = {
  communicationId: string;
  confirmMessage: string;
  label: string;
};

export function DeleteCommunicationButton({ communicationId, confirmMessage, label }: Props) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          start(() => deleteCommunication(communicationId));
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={15} strokeWidth={2.2} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
