import { getTranslations } from 'next-intl/server';

import { createGroup } from '@/app/(admin)/admin/groups/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { GroupForm } from '@/components/admin/group-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';

export default async function NewGroupPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();

  return (
    <AppShell
      title={t('admin.groups.new')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t('admin.groups.new')}
        </h2>
        <GroupForm action={createGroup} submitLabel={t('common.create')} />
      </div>
    </AppShell>
  );
}
