import type { ReactNode } from 'react';

import { SignOutButton } from './sign-out-button';

type AppShellProps = {
  title: string;
  role: string;
  fullName: string;
  nav?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, role, fullName, nav, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{role}</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{fullName}</span>
            <SignOutButton />
          </div>
        </div>
        {nav ? (
          <nav className="mx-auto flex max-w-5xl gap-1 px-2 sm:px-4">{nav}</nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
