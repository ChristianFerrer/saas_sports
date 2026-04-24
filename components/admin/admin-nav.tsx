'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckSquare,
  LayoutGrid,
  Mail,
  Settings,
  UserPlus,
  Users,
  Layers,
  type LucideIcon
} from 'lucide-react';
import { useTranslations } from 'next-intl';

type NavItem = {
  href: string;
  key:
    | 'dashboard'
    | 'groups'
    | 'students'
    | 'attendance'
    | 'invitations'
    | 'communications'
    | 'settings';
  exact: boolean;
  Icon: LucideIcon;
};

const LINKS: readonly NavItem[] = [
  { href: '/admin', key: 'dashboard', exact: true, Icon: LayoutGrid },
  { href: '/admin/groups', key: 'groups', exact: false, Icon: Layers },
  { href: '/admin/students', key: 'students', exact: false, Icon: Users },
  { href: '/admin/attendance', key: 'attendance', exact: false, Icon: CheckSquare },
  { href: '/admin/invitations', key: 'invitations', exact: false, Icon: UserPlus },
  { href: '/admin/communications', key: 'communications', exact: false, Icon: Mail },
  { href: '/admin/settings', key: 'settings', exact: false, Icon: Settings }
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');

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
