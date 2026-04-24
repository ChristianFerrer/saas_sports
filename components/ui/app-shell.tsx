import type { ReactNode } from 'react';

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

export function AppShell({
  title,
  role,
  fullName,
  actions,
  kicker,
  children
}: Props) {
  return (
    <PremiumShell
      roleLabel={role}
      fullName={fullName}
      title={title}
      kicker={kicker}
      actions={actions}
    >
      {children}
    </PremiumShell>
  );
}
