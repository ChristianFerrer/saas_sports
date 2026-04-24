import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { ParentNav } from '@/components/ui/parent-nav';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type StudentParentRow = {
  student_id: string;
  relationship: string | null;
  students: { id: string; full_name: string; group_id: string | null } | null;
};

type GroupRow = { id: string; name: string };
type AttendanceRow = { student_id: string; present: boolean };

export default async function ParentHomePage() {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data: linkRows } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students (id, full_name, group_id)')
    .eq('parent_user_id', user.id);

  const links = (linkRows ?? []) as StudentParentRow[];
  const students = links
    .map((l) => l.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const groupIds = Array.from(
    new Set(students.map((s) => s.group_id).filter((id): id is string => id !== null))
  );
  const studentIds = students.map((s) => s.id);

  const [groupsResult, attendanceResult] = await Promise.all([
    groupIds.length > 0
      ? supabase.from('groups').select('id, name').in('id', groupIds)
      : Promise.resolve({ data: [] as GroupRow[] }),
    studentIds.length > 0
      ? supabase
          .from('attendances')
          .select('student_id, present')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [] as AttendanceRow[] })
  ]);

  const groupsById = new Map<string, string>();
  for (const g of (groupsResult.data ?? []) as GroupRow[]) {
    groupsById.set(g.id, g.name);
  }

  const statsByStudent = new Map<string, { present: number; total: number }>();
  for (const a of (attendanceResult.data ?? []) as AttendanceRow[]) {
    const curr = statsByStudent.get(a.student_id) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (a.present) curr.present += 1;
    statsByStudent.set(a.student_id, curr);
  }

  return (
    <AppShell
      title={t('parent.home.title')}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
      nav={<ParentNav />}
    >
      <p className="text-slate-700">
        {t('parent.home.welcome', { name: user.profile.full_name })}
      </p>

      {students.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('parent.home.empty')}
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {students.map((s) => {
            const stats = statsByStudent.get(s.id) ?? { present: 0, total: 0 };
            const pct =
              stats.total === 0 ? null : Math.round((stats.present / stats.total) * 100);
            const groupName = s.group_id ? groupsById.get(s.group_id) : undefined;
            return (
              <li key={s.id}>
                <Link
                  href={`/parent/children/${s.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-400 hover:shadow-sm"
                >
                  <p className="font-medium text-slate-900">{s.full_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {groupName ?? t('admin.students.unassigned')}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {pct === null
                      ? t('parent.attendance.noData')
                      : t('parent.attendance.percentage', {
                          pct,
                          present: stats.present,
                          total: stats.total
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
