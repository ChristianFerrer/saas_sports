import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function AdminHomePage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase.from('groups').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true })
  ]);

  const groupsCount = groupsResult.count ?? 0;
  const studentsCount = studentsResult.count ?? 0;

  return (
    <AppShell
      title={t('admin.home.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <p className="text-slate-700">
        {t('admin.home.welcome', { name: user.profile.full_name })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/groups"
          className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t('admin.home.stats.groups')}
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{groupsCount}</p>
        </Link>

        <Link
          href="/admin/students"
          className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t('admin.home.stats.students')}
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{studentsCount}</p>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/groups/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.home.actions.newGroup')}
        </Link>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('admin.home.actions.newStudent')}
        </Link>
      </div>
    </AppShell>
  );
}
