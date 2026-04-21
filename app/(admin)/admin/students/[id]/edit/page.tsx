import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  updateStudent,
  type StudentFormState
} from '@/app/(admin)/admin/students/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { StudentForm } from '@/components/admin/student-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function EditStudentPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [studentRes, groupsRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, birth_date, group_id')
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('groups').select('id, name').order('name', { ascending: true })
  ]);

  const student = studentRes.data as {
    id: string;
    full_name: string;
    birth_date: string | null;
    group_id: string | null;
  } | null;
  const groups = (groupsRes.data ?? []) as Array<{ id: string; name: string }>;

  if (!student) notFound();

  const boundUpdate = async (
    prev: StudentFormState,
    formData: FormData
  ): Promise<StudentFormState> => {
    'use server';
    return updateStudent(params.id, prev, formData);
  };

  return (
    <AppShell
      title={t('admin.students.edit')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t('admin.students.edit')}
        </h2>
        <StudentForm
          action={boundUpdate}
          groups={groups}
          defaults={{
            fullName: student.full_name,
            birthDate: student.birth_date,
            groupId: student.group_id
          }}
          submitLabel={t('common.save')}
        />
      </div>
    </AppShell>
  );
}
