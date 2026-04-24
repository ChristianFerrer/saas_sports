import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { PremiumProgressRing } from '@/components/ui/premium-progress-ring';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string };
type StudentRow = { group_id: string | null };
type SessionRow = {
  id: string;
  group_id: string;
  status: 'scheduled' | 'held' | 'cancelled';
};
type AttendanceRow = { session_id: string; present: boolean };

function bandClasses(pct: number | null): string {
  if (pct === null) return 'ss-pill-mute';
  if (pct >= 80) return 'ss-pill-success';
  if (pct >= 50) return 'ss-pill-warn';
  return 'ss-pill-danger';
}

export default async function AdminAttendanceIndexPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult, sessionsResult, attendanceResult] =
    await Promise.all([
      supabase
        .from('groups')
        .select('id, name')
        .eq('school_id', user.profile.school_id)
        .order('name', { ascending: true }),
      supabase.from('students').select('group_id'),
      supabase.from('class_sessions').select('id, group_id, status'),
      supabase.from('attendances').select('session_id, present')
    ]);

  const groups = (groupsResult.data ?? []) as GroupRow[];
  const studentRows = (studentsResult.data ?? []) as StudentRow[];
  const sessionRows = (sessionsResult.data ?? []) as SessionRow[];
  const attendanceRows = (attendanceResult.data ?? []) as AttendanceRow[];

  const studentsByGroup = new Map<string, number>();
  for (const s of studentRows) {
    if (s.group_id) {
      studentsByGroup.set(s.group_id, (studentsByGroup.get(s.group_id) ?? 0) + 1);
    }
  }

  const sessionsByGroup = new Map<string, { scheduled: number; held: number }>();
  const sessionToGroup = new Map<string, string>();
  for (const s of sessionRows) {
    sessionToGroup.set(s.id, s.group_id);
    const curr = sessionsByGroup.get(s.group_id) ?? { scheduled: 0, held: 0 };
    if (s.status === 'scheduled') curr.scheduled += 1;
    if (s.status === 'held') curr.held += 1;
    sessionsByGroup.set(s.group_id, curr);
  }

  const attendanceByGroup = new Map<string, { present: number; total: number }>();
  let overallPresent = 0;
  let overallTotal = 0;
  for (const a of attendanceRows) {
    const gid = sessionToGroup.get(a.session_id);
    if (!gid) continue;
    const curr = attendanceByGroup.get(gid) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (a.present) curr.present += 1;
    attendanceByGroup.set(gid, curr);
    overallTotal += 1;
    if (a.present) overallPresent += 1;
  }

  const overallPct =
    overallTotal === 0 ? null : Math.round((overallPresent / overallTotal) * 100);

  const rows = groups
    .map((g) => {
      const stats = attendanceByGroup.get(g.id) ?? { present: 0, total: 0 };
      const pct =
        stats.total === 0 ? null : Math.round((stats.present / stats.total) * 100);
      const students = studentsByGroup.get(g.id) ?? 0;
      const counts = sessionsByGroup.get(g.id) ?? { scheduled: 0, held: 0 };
      return { ...g, stats, pct, students, counts };
    })
    // Sort so the groups that need attention (low %) come first,
    // then un-recorded, then high performers last.
    .sort((a, b) => {
      const rank = (p: number | null) => (p === null ? 150 : p);
      return rank(a.pct) - rank(b.pct);
    });

  const attentionGroups = rows.filter((r) => r.pct !== null && r.pct < 50);

  return (
    <AppShell
      title={t('admin.attendance.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <section className="ss-card-strong flex items-center gap-5 p-5 sm:p-6">
        <PremiumProgressRing
          value={overallPct}
          size={128}
          strokeWidth={14}
          variant="auto"
          sublabel={t('admin.attendance.overviewKicker')}
        />
        <div className="min-w-0 flex-1">
          <p className="ss-kicker text-gold-300">
            {t('admin.attendance.overviewKicker')}
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink-50 sm:text-4xl">
            {overallPct === null
              ? t('admin.attendance.noData')
              : t('admin.attendance.overviewValue', { pct: overallPct })}
          </p>
          <p className="mt-1 text-sm text-ink-200">
            {t('admin.attendance.overviewDetail', {
              present: overallPresent,
              total: overallTotal
            })}
          </p>
          {attentionGroups.length > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden />
              {t('admin.attendance.attentionNeeded', {
                count: attentionGroups.length
              })}
            </p>
          ) : null}
        </div>
      </section>

      <h3 className="mt-6 mb-3 ss-kicker text-gold-300">
        {t('admin.attendance.pickGroup')}
      </h3>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-ink-300">
          {t('admin.attendance.emptyGroups')}{' '}
          <Link
            href="/admin/groups/new"
            className="font-semibold text-gold-300 hover:text-gold-200"
          >
            {t('admin.groups.new')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((g) => (
            <li key={g.id}>
              <Link
                href={`/admin/attendance/${g.id}`}
                className="group ss-card flex items-stretch gap-3 p-4 transition hover:border-white/15 hover:shadow-pop"
              >
                <PremiumProgressRing
                  value={g.pct}
                  size={76}
                  strokeWidth={9}
                  variant="auto"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate font-semibold text-ink-50">
                        {g.name}
                      </p>
                      {g.pct !== null ? (
                        <span className={`${bandClasses(g.pct)} shrink-0`}>
                          {g.pct}%
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-300">
                      {t('admin.groups.studentsCount', { count: g.students })}
                    </p>
                    <p className="text-xs text-ink-300">
                      {t('admin.attendance.sessionsSummary', {
                        scheduled: g.counts.scheduled,
                        held: g.counts.held
                      })}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-300">
                      {g.stats.total === 0
                        ? t('admin.attendance.noData')
                        : t('admin.attendance.attendanceRatio', {
                            present: g.stats.present,
                            total: g.stats.total
                          })}
                    </span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-ink-400 transition group-hover:text-ink-100"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
