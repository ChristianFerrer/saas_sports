import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string };
type StudentRow = { group_id: string | null };
type SessionRow = { group_id: string; status: 'scheduled' | 'held' | 'cancelled' };

export default async function AdminAttendanceIndexPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult, sessionsResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name')
      .eq('school_id', user.profile.school_id)
      .order('name', { ascending: true }),
    supabase.from('students').select('group_id'),
    supabase.from('class_sessions').select('group_id, status')
  ]);

  const groups = (groupsResult.data ?? []) as GroupRow[];
  const studentRows = (studentsResult.data ?? []) as StudentRow[];
  const sessionRows = (sessionsResult.data ?? []) as SessionRow[];

  const studentsByGroup = new Map<string, number>();
  for (const s of studentRows) {
    if (s.group_id) {
      studentsByGroup.set(s.group_id, (studentsByGroup.get(s.group_id) ?? 0) + 1);
    }
  }

  const sessionsByGroup = new Map<string, { scheduled: number; held: number }>();
  for (const s of sessionRows) {
    const curr = sessionsByGroup.get(s.group_id) ?? { scheduled: 0, held: 0 };
    if (s.status === 'scheduled') curr.scheduled += 1;
    if (s.status === 'held') curr.held += 1;
    sessionsByGroup.set(s.group_id, curr);
  }

  return (
    <AppShell
      title={t('admin.attendance.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        {t('admin.attendance.pickGroup')}
      </h2>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('admin.attendance.emptyGroups')}{' '}
          <Link href="/admin/groups/new" className="text-emerald-700 hover:text-emerald-800">
            {t('admin.groups.new')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const students = studentsByGroup.get(g.id) ?? 0;
            const counts = sessionsByGroup.get(g.id) ?? { scheduled: 0, held: 0 };
            return (
              <li key={g.id}>
                <Link
                  href={`/admin/attendance/${g.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-400 hover:shadow-sm"
                >
                  <p className="font-medium text-slate-900">{g.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('admin.groups.studentsCount', { count: students })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('admin.attendance.sessionsSummary', {
                      scheduled: counts.scheduled,
                      held: counts.held
                    })}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
