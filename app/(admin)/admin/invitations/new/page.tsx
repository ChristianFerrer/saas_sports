import { getTranslations } from 'next-intl/server';

import { InvitationForm } from '@/components/admin/invitation-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type StudentRow = { id: string; full_name: string };

export default async function NewInvitationPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('school_id', user.profile.school_id)
    .order('full_name', { ascending: true });

  const students = (data ?? []) as StudentRow[];

  return (
    <AppShell
      title={t('admin.invitations.new')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-ink-50">
          {t('admin.invitations.new')}
        </h2>
        <InvitationForm
          students={students.map((s) => ({ id: s.id, fullName: s.full_name }))}
          submitLabel={t('common.create')}
        />
      </div>
    </AppShell>
  );
}
