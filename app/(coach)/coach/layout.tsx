import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/guards';

export default async function CoachLayout({ children }: { children: ReactNode }) {
  await requireRole('coach');
  return <>{children}</>;
}
