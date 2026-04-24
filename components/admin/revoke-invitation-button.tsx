'use client';

import { useTransition } from 'react';

import { revokeInvitation } from '@/app/(admin)/admin/invitations/actions';

type Props = {
  invitationId: string;
  confirmMessage: string;
  label: string;
};

export function RevokeInvitationButton({ invitationId, confirmMessage, label }: Props) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          start(() => revokeInvitation(invitationId));
        }
      }}
      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
