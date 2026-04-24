import type { ReactNode } from 'react';

import { BrandMark } from '@/components/ui/brand-mark';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <main className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-12 sm:items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-80"
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark size={56} />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-100">
            SMART<span className="text-gold-300">SPOTS</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400">
            Academy
          </p>
        </div>
        <div className="ss-card-strong p-6 sm:p-7">
          <header className="mb-5 space-y-1">
            <h1 className="text-[22px] font-bold tracking-tight text-ink-50">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-ink-200">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
        {footer ? (
          <div className="mt-5 text-center text-sm text-ink-200">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
