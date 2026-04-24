'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { useTransition, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';

import { BrandWordmark, BrandMark } from './brand-mark';
import {
  ADMIN_NAV_ITEMS,
  COACH_NAV_ITEMS,
  PARENT_NAV_ITEMS,
  type NavItem
} from './nav-items';

type Role = 'admin' | 'coach' | 'parent';

type Props = {
  roleLabel: string;
  fullName: string;
  title: string;
  kicker?: string;
  children: ReactNode;
  /** Optional right-aligned hero-area actions (e.g. primary CTA). */
  actions?: ReactNode;
};

function resolveRole(pathname: string): Role {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/coach')) return 'coach';
  return 'parent';
}

function navConfig(role: Role): { items: readonly NavItem[]; namespace: string } {
  if (role === 'admin') return { items: ADMIN_NAV_ITEMS, namespace: 'admin.nav' };
  if (role === 'coach') return { items: COACH_NAV_ITEMS, namespace: 'coach.nav' };
  return { items: PARENT_NAV_ITEMS, namespace: 'parent.nav' };
}

export function PremiumShell({
  roleLabel,
  fullName,
  title,
  kicker,
  children,
  actions
}: Props) {
  const pathname = usePathname() ?? '/';
  const role = resolveRole(pathname);
  const { items, namespace } = navConfig(role);

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen">
      <DesktopSidebar
        fullName={fullName}
        initials={initials}
        items={items}
        namespace={namespace}
        pathname={pathname}
      />

      <div className="md:pl-64">
        <TopBar
          roleLabel={roleLabel}
          title={title}
          kicker={kicker}
          fullName={fullName}
          initials={initials}
          actions={actions}
        />

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-10 animate-fade-in">
          {children}
        </main>
      </div>

      <MobileBottomNav items={items} namespace={namespace} pathname={pathname} />
    </div>
  );
}

function DesktopSidebar({
  fullName,
  initials,
  items,
  namespace,
  pathname
}: {
  fullName: string;
  initials: string;
  items: readonly NavItem[];
  namespace: string;
  pathname: string;
}) {
  const t = useTranslations(namespace);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-navy-900/95 px-4 py-6 backdrop-blur md:flex">
      <Link href="/" className="mb-7 flex items-center gap-2.5 no-tap-highlight">
        <BrandWordmark size={30} />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, key, exact, Icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'group relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold-500/15 to-transparent px-3 py-2.5 text-sm font-semibold text-gold-200'
                  : 'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-200 transition hover:bg-white/[0.04] hover:text-ink-50'
              }
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-gradient-to-b from-gold-200 to-gold-500"
                />
              ) : null}
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 2}
                aria-hidden
                className={active ? 'text-gold-300' : 'text-ink-300'}
              />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-[12px] font-bold text-navy-900">
            {initials || '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-50">{fullName}</p>
          </div>
          <SignOutInline />
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  roleLabel,
  title,
  kicker,
  fullName,
  initials,
  actions
}: {
  roleLabel: string;
  title: string;
  kicker?: string;
  fullName: string;
  initials: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-navy-950/70 backdrop-blur safe-pt">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-3 sm:px-6">
        <Link href="/" className="md:hidden">
          <BrandMark size={30} />
          <span className="sr-only">SmartSpots</span>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="ss-kicker">{kicker ?? roleLabel}</p>
          <h1 className="truncate text-[18px] font-bold tracking-tight text-ink-50 sm:text-[20px]">
            {title}
          </h1>
        </div>

        {actions ? <div className="hidden shrink-0 sm:block">{actions}</div> : null}

        <button
          type="button"
          aria-label="Notificaciones"
          className="hidden h-10 w-10 place-items-center rounded-xl border border-white/5 bg-white/[0.03] text-ink-200 transition hover:bg-white/[0.06] hover:text-ink-50 sm:grid md:hidden"
        >
          <Bell size={18} strokeWidth={2} aria-hidden />
        </button>

        <span
          className="hidden h-10 items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] pl-1 pr-3 text-sm text-ink-100 sm:inline-flex md:hidden"
          title={fullName}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-[11px] font-bold text-navy-900">
            {initials || '·'}
          </span>
          <span className="max-w-[14ch] truncate">{fullName}</span>
        </span>

        <span className="md:hidden">
          <SignOutInline />
        </span>
      </div>

      {actions ? (
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:hidden">{actions}</div>
      ) : null}
    </header>
  );
}

function MobileBottomNav({
  items,
  namespace,
  pathname
}: {
  items: readonly NavItem[];
  namespace: string;
  pathname: string;
}) {
  const t = useTranslations(namespace);
  const visible = items.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-navy-950/85 backdrop-blur safe-pb md:hidden">
      <div
        className="mx-auto grid max-w-md gap-0.5 px-2 pt-1"
        style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
      >
        {visible.map(({ href, key, exact, Icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-gold-300'
                  : 'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] text-ink-300 transition hover:text-ink-100'
              }
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
              <span className="truncate">{t(key)}</span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute -top-px left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-200 to-gold-500"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SignOutInline() {
  const [pending, start] = useTransition();
  const t = useTranslations('common');
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t('signOut')}
      title={t('signOut')}
      onClick={() =>
        start(async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = '/login';
        })
      }
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-300 transition hover:bg-white/[0.06] hover:text-ink-50 disabled:opacity-60"
    >
      <LogOut size={16} strokeWidth={2.2} aria-hidden />
    </button>
  );
}
