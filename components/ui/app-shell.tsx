import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  computeAcademyTier,
  fetchAcademyStats,
  type AcademyTier
} from '@/lib/academy/tier';
import { getCurrentUser } from '@/lib/auth/profile';
import { createUntypedClient } from '@/lib/supabase/server';

import { PremiumShell } from './premium-shell';

type Props = {
  title: string;
  /** Display label for the role ("Administrador", "Entrenador", "Padre/Madre"). */
  role: string;
  fullName: string;
  /**
   * Accepted for backward compatibility with pages that still pass
   * `<AdminNav />` / `<ParentNav />` — the new shell resolves the nav
   * from the current pathname so this prop is intentionally ignored.
   */
  nav?: ReactNode;
  /** Optional right-aligned header actions for the current screen. */
  actions?: ReactNode;
  /** Optional small caption above the title. Defaults to `role`. */
  kicker?: string;
  children: ReactNode;
};

const TIER_LABEL: Record<AcademyTier, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  elite: 'Élite'
};

export async function AppShell({
  title,
  role,
  fullName,
  actions,
  kicker,
  children
}: Props) {
  const t = await getTranslations();

  // Single extra query per page render for the sidebar tier badge. The
  // shell will simply skip the widget if the user has no profile or
  // the count query fails — we never block rendering on it.
  let academy:
    | { tier: AcademyTier; label: string; caption: string }
    | undefined;

  try {
    const current = await getCurrentUser();
    const schoolId = current?.profile?.school_id ?? null;
    if (schoolId) {
      const supabase = createUntypedClient();
      const stats = await fetchAcademyStats(supabase, schoolId);
      const tier = computeAcademyTier(stats);
      academy = {
        tier,
        label: TIER_LABEL[tier],
        caption: t('common.academyTierCaption', {
          count: stats.sessionsHeld
        })
      };
    }
  } catch {
    // Silent fail: sidebar just renders without the badge.
  }

  return (
    <PremiumShell
      roleLabel={role}
      fullName={fullName}
      title={title}
      kicker={kicker}
      actions={actions}
      academy={academy}
    >
      {children}
    </PremiumShell>
  );
}
