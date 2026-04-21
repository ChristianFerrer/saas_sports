import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteStudentButton } from '@/components/admin/delete-student-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SearchParams = { error?: string };

export default async function AdminStudentsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [studentsResult, groupsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, birth_date, group_id')
      .order('full_name', { ascending: true }),
    supabase.from('groups').select('id, name')
  ]);

  const students = (studentsResult.data ?? []) as Array<{
    id: string;
    full_name: string;
    birth_date: string | null;
    group_id: string | null;
  }>;
  const groupRows = (groupsResult.data ?? []) as Array<{ id: string; name: string }>;
  const groupNameById = new Map<string, string>();
  for (const g of groupRows) {
    groupNameById.set(g.id, g.name);
  }

  return (
    <AppShell
      title={t('admin.students.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('admin.students.title')}
        </h2>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.students.new')}
        </Link>
      </div>

      {searchParams.error ? (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {searchParams.error}
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('admin.students.empty')}
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {students.map((s) => {
            const groupName = s.group_id ? (groupNameById.get(s.group_id) ?? null) : null;
            return (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{s.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {groupName ?? t('admin.students.unassigned')}
                    {s.birth_date ? ` · ${s.birth_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/students/${s.id}/edit`}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    {t('common.edit')}
                  </Link>
                  <DeleteStudentButton
                    id={s.id}
                    confirmMessage={t('admin.students.deleteConfirm', {
                      name: s.full_name
                    })}
                    label={t('common.delete')}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
