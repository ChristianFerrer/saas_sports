import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { updateGroup, type GroupFormState } from '@/app/(admin)/admin/groups/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { GroupForm } from '@/components/admin/group-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function EditGroupPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', params.id)
    .maybeSingle();

  const group = groupData as { id: string; name: string } | null;
  if (!group) notFound();

  const boundUpdate = async (
    prev: GroupFormState,
    formData: FormData
  ): Promise<GroupFormState> => {
    'use server';
    return updateGroup(params.id, prev, formData);
  };

  return (
    <AppShell
      title={t('admin.groups.edit')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t('admin.groups.edit')}
        </h2>
        <GroupForm
          action={boundUpdate}
          defaultName={group.name}
          submitLabel={t('common.save')}
        />
      </div>
    </AppShell>
  );
}
