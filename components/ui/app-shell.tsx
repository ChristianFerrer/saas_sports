import type { ReactNode } from 'react';

import { BrandMark } from './brand-mark';
import { SignOutButton } from './sign-out-button';

type AppShellProps = {
  title: string;
  role: string;
  fullName: string;
  nav?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, role, fullName, nav, children }: AppShellProps) {
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 glass-nav safe-pt">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 text-emerald-600">
              <BrandMark size={28} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                {role}
              </p>
              <h1 className="truncate text-[17px] font-semibold leading-tight text-slate-900">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="hidden h-9 items-center gap-2 rounded-full bg-slate-100/80 pl-1 pr-3 text-sm text-slate-700 sm:inline-flex"
              title={fullName}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                {initials || '·'}
              </span>
              <span className="max-w-[14ch] truncate">{fullName}</span>
            </span>
            <SignOutButton />
          </div>
        </div>

        {nav ? (
          <nav
            aria-label="Primary"
            className="mx-auto flex w-full max-w-5xl items-stretch gap-1 overflow-x-auto scrollbar-none px-2 sm:px-4"
          >
            {nav}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
