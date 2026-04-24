import {
  CheckSquare,
  Home,
  LayoutGrid,
  Layers,
  Mail,
  Settings,
  Target,
  UserPlus,
  Users,
  type LucideIcon
} from 'lucide-react';

export type NavItem = {
  href: string;
  /** Translation key under the role's nav namespace (e.g. admin.nav.<key>). */
  key: string;
  /** `true` when the route should match exactly (no startsWith). */
  exact?: boolean;
  Icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { href: '/admin', key: 'dashboard', exact: true, Icon: LayoutGrid },
  { href: '/admin/groups', key: 'groups', Icon: Layers },
  { href: '/admin/students', key: 'students', Icon: Users },
  { href: '/admin/attendance', key: 'attendance', Icon: CheckSquare },
  { href: '/admin/invitations', key: 'invitations', Icon: UserPlus },
  { href: '/admin/communications', key: 'communications', Icon: Mail },
  { href: '/admin/settings', key: 'settings', Icon: Settings }
] as const;

export const PARENT_NAV_ITEMS: readonly NavItem[] = [
  { href: '/parent', key: 'home', exact: true, Icon: Home },
  { href: '/parent/messages', key: 'messages', Icon: Mail }
] as const;

export const COACH_NAV_ITEMS: readonly NavItem[] = [
  { href: '/coach', key: 'home', exact: true, Icon: Home }
] as const;

// Used by Target-icon imports where needed elsewhere
export { Target };
