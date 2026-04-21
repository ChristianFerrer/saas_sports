import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteGroupButton } from '@/components/admin/delete-group-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SearchParams = { error?: string };

export default async function AdminGroupsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase.from('groups').select('id, name').order('name', { ascending: true }),
    supabase.from('students').select('group_id')
  ]);

  const groups = (groupsResult.data ?? []) as Array<{ id: string; name: string }>;
  const studentRows = (studentsResult.data ?? []) as Array<{ group_id: string | null }>;
  const countByGroup = new Map<string, number>();
  for (const s of studentRows) {
    if (s.group_id) {
      countByGroup.set(s.group_id, (countByGroup.get(s.group_id) ?? 0) + 1);
    }
  }

  const errorMessage =
    searchParams.error === 'hasStudents'
      ? t('admin.groups.errors.hasStudents')
      : searchParams.error;

  return (
    <AppShell
      title={t('admin.groups.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('admin.groups.title')}
        </h2>
        <Link
          href="/admin/groups/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.groups.new')}
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('admin.groups.empty')}
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {groups.map((g) => {
            const count = countByGroup.get(g.id) ?? 0;
            return (
              <li key={g.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{g.name}</p>
                  <p className="text-xs text-slate-500">
                    {t('admin.groups.studentsCount', { count })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/groups/${g.id}/edit`}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    {t('common.edit')}
                  </Link>
                  <DeleteGroupButton
                    id={g.id}
                    confirmMessage={t('admin.groups.deleteConfirm', { name: g.name })}
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
