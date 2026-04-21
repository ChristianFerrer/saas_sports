import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </header>
        {children}
        {footer ? <div className="text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </main>
  );
}
