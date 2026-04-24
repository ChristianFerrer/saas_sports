import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { CommunicationForm } from '@/components/admin/communication-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string };

export default async function NewCommunicationPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data } = await supabase
    .from('groups')
    .select('id, name')
    .eq('school_id', user.profile.school_id)
    .order('name', { ascending: true });

  const groups = (data ?? []) as GroupRow[];

  return (
    <AppShell
      title={t('admin.communications.new')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="max-w-xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t('admin.communications.new')}
        </h2>
        <CommunicationForm
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          submitLabel={t('admin.communications.send')}
        />
      </div>
    </AppShell>
  );
}
