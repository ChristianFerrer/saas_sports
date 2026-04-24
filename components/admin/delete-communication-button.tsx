'use client';

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
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          start(() => deleteCommunication(communicationId));
        }
      }}
      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
