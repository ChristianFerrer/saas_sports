import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/guards';

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await requireRole('parent');
  return <>{children}</>;
}
