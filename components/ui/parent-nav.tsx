'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LINKS = [
  { href: '/parent', key: 'home', exact: true },
  { href: '/parent/messages', key: 'messages', exact: false }
] as const;

export function ParentNav() {
  const pathname = usePathname();
  const t = useTranslations('parent.nav');

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
