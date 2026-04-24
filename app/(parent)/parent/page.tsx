import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_PALETTE = [
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700'
];

function paletteFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[hash];
}

export default async function ParentHomePage() {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data: linkRows } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students (id, full_name, group_id)')
    .eq('parent_user_id', user.id);

  const links = (linkRows ?? []) as unknown as StudentParentRow[];
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
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-100/90">
          {t('parent.home.greetingKicker')}
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
          {t('parent.home.welcome', { name: user.profile.full_name })}
        </h2>
        <p className="mt-1 max-w-md text-sm text-emerald-50/90">
          {t('parent.home.tagline')}
        </p>
      </section>

      {students.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {t('parent.home.empty')}
        </div>
      ) : (
        <>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            {t('parent.home.yourChildren')}
          </h3>
          <ul className="mt-2 space-y-2">
            {students.map((s) => {
              const stats = statsByStudent.get(s.id) ?? { present: 0, total: 0 };
              const pct =
                stats.total === 0 ? null : Math.round((stats.present / stats.total) * 100);
              const groupName = s.group_id ? groupsById.get(s.group_id) : undefined;
              return (
                <li key={s.id}>
                  <Link
                    href={`/parent/children/${s.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-slate-300 hover:shadow-pop"
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${paletteFor(s.id)}`}
                    >
                      {initialsOf(s.full_name) || '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{s.full_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {groupName ?? t('admin.students.unassigned')}
                      </p>
                      {pct === null ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {t('parent.attendance.noData')}
                        </p>
                      ) : (
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {t('parent.attendance.percentage', {
                                pct,
                                present: stats.present,
                                total: stats.total
                              })}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={
                                pct >= 80
                                  ? 'h-full bg-emerald-500'
                                  : pct >= 50
                                    ? 'h-full bg-amber-500'
                                    : 'h-full bg-red-500'
                              }
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-400 transition group-hover:text-slate-700"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AppShell>
  );
}
