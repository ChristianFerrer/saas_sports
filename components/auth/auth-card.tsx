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
    <main className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-12 sm:items-center">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 text-emerald-600">
            <BrandMark size={44} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            SmartSpots
          </p>
        </div>
        <div className="ss-card p-6 sm:p-7">
          <header className="mb-5 space-y-1">
            <h1 className="text-[22px] font-semibold leading-tight text-slate-900">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
          </header>
          {children}
        </div>
        {footer ? (
          <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
