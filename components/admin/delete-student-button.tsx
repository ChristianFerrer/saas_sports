'use client';

import { useTransition } from 'react';

import { deleteStudent } from '@/app/(admin)/admin/students/actions';

type Props = {
  id: string;
  confirmMessage: string;
  label: string;
};

export function DeleteStudentButton({ id, confirmMessage, label }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          void deleteStudent(id);
        });
      }}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
