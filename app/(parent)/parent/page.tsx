import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';

export default async function ParentHomePage() {
  const user = await requireRole('parent');
  const t = await getTranslations();

  return (
    <AppShell
      title={t('parent.home.title')}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
    >
      <p className="text-slate-700">
        {t('parent.home.welcome', { name: user.profile.full_name })}
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        {t('parent.home.empty')}
      </div>
    </AppShell>
  );
}
