import { getTranslations } from 'next-intl/server';

import { createStudent } from '@/app/(admin)/admin/students/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { StudentForm } from '@/components/admin/student-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function NewStudentPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data } = await supabase
    .from('groups')
    .select('id, name')
    .order('name', { ascending: true });

  const groups = (data ?? []) as Array<{ id: string; name: string }>;

  return (
    <AppShell
      title={t('admin.students.new')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t('admin.students.new')}
        </h2>
        <StudentForm
          action={createStudent}
          groups={groups}
          submitLabel={t('common.create')}
        />
      </div>
    </AppShell>
  );
}
