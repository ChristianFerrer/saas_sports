'use client';

import { Trash2 } from 'lucide-react';
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
      aria-label={label}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          void deleteStudent(id);
        });
      }}
      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={15} strokeWidth={2.2} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
