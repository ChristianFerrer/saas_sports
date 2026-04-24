'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LINKS = [
  { href: '/admin', key: 'dashboard', exact: true },
  { href: '/admin/groups', key: 'groups', exact: false },
  { href: '/admin/students', key: 'students', exact: false },
  { href: '/admin/attendance', key: 'attendance', exact: false },
  { href: '/admin/invitations', key: 'invitations', exact: false }
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');

  return (
    <>
      {LINKS.map(({ href, key, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? 'border-b-2 border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:text-slate-900'
            }
          >
            {t(key)}
          </Link>
        );
      })}
    </>
  );
}
