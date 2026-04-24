'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mail, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type NavItem = {
  href: string;
  key: 'home' | 'messages';
  exact: boolean;
  Icon: LucideIcon;
};

const LINKS: readonly NavItem[] = [
  { href: '/parent', key: 'home', exact: true, Icon: Home },
  { href: '/parent/messages', key: 'messages', exact: false, Icon: Mail }
] as const;

export function ParentNav() {
  const pathname = usePathname();
  const t = useTranslations('parent.nav');

  return (
    <>
      {LINKS.map(({ href, key, exact, Icon }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'relative inline-flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-emerald-700 after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-emerald-600'
                : 'inline-flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm text-slate-600 transition hover:text-slate-900'
            }
          >
            <Icon size={16} strokeWidth={active ? 2.4 : 2} aria-hidden />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </>
  );
}
