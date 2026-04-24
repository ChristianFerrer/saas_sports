'use client';

import { Trash2 } from 'lucide-react';
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
      aria-label={label}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          start(() => deleteSession(groupId, sessionId));
        }
      }}
      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={15} strokeWidth={2.2} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
