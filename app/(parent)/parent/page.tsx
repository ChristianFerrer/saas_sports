import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { PremiumProgressBar } from '@/components/ui/premium-progress-bar';
import { PremiumSectionTitle } from '@/components/ui/premium-section-title';
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
  'bg-gold-500/20 text-gold-200 ring-1 ring-gold-400/20',
  'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/20',
  'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/20',
  'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/20',
  'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/20'
];

function paletteFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1)
    hash = (hash + id.charCodeAt(i)) % AVATAR_PALETTE.length;
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
      kicker={t('parent.home.greetingKicker')}
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-navy-800/60 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-70"
        />
        <div className="relative z-10 max-w-xl">
          <p className="ss-kicker text-gold-300">
            {t('parent.home.greetingKicker')}
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-4xl">
            <span className="text-gradient-gold">{user.profile.full_name}</span>
          </h2>
          <p className="mt-2 text-sm text-ink-200 sm:text-base">
            {t('parent.home.tagline')}
          </p>
        </div>
      </section>

      {students.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-ink-300">
          {t('parent.home.empty')}
        </div>
      ) : (
        <>
          <PremiumSectionTitle
            kicker={t('parent.home.yourChildren')}
            title={t('parent.home.yourChildren')}
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {students.map((s) => {
              const stats = statsByStudent.get(s.id) ?? { present: 0, total: 0 };
              const pct =
                stats.total === 0 ? null : Math.round((stats.present / stats.total) * 100);
              const groupName = s.group_id ? groupsById.get(s.group_id) : undefined;
              return (
                <li key={s.id}>
                  <Link
                    href={`/parent/children/${s.id}`}
                    className="group ss-card flex items-start gap-3 p-4 transition hover:border-white/15 hover:shadow-pop"
                  >
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-bold ${paletteFor(s.id)}`}
                    >
                      {initialsOf(s.full_name) || '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-ink-50">
                        {s.full_name}
                      </p>
                      <p className="truncate text-xs text-gold-300">
                        {groupName ?? t('admin.students.unassigned')}
                      </p>
                      {pct === null ? (
                        <p className="mt-1 text-xs text-ink-400">
                          {t('parent.attendance.noData')}
                        </p>
                      ) : (
                        <div className="mt-3">
                          <PremiumProgressBar
                            label={t('parent.detail.attendance')}
                            value={pct}
                            tone="auto"
                            valueLabel={`${pct}% · ${stats.present}/${stats.total}`}
                          />
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-ink-400 transition group-hover:text-ink-100"
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
