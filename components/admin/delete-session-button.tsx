'use client';

import { useTransition } from 'react';

import { deleteSession } from '@/app/(admin)/admin/attendance/actions';

type DeleteSessionButtonProps = {
  groupId: string;
  sessionId: string;
  confirmMessage: string;
  label: string;
};

export function DeleteSessionButton({
  groupId,
  sessionId,
  confirmMessage,
  label
}: DeleteSessionButtonProps) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          start(() => deleteSession(groupId, sessionId));
        }
      }}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
