'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

type Props = {
  url: string;
  label: string;
  copiedLabel: string;
};

export function InvitationLink({ url, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <input
        type="text"
        value={url}
        readOnly
        onFocus={(e) => e.currentTarget.select()}
        className="ss-input font-mono text-[13px]"
      />
      <button
        type="button"
        onClick={copy}
        className={
          copied
            ? 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition'
            : 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.98]'
        }
      >
        {copied ? (
          <>
            <Check size={16} strokeWidth={2.6} aria-hidden />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy size={16} strokeWidth={2.2} aria-hidden />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
