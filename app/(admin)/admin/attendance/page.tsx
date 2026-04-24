import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { AttendanceRing } from '@/components/admin/attendance-ring';
import { AppShell } from '@/components/ui/app-shell';
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

function bandColor(pct: number | null): { bg: string; text: string; label: 'high' | 'mid' | 'low' | 'none' } {
  if (pct === null) return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'none' };
  if (pct >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'high' };
  if (pct >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', label: 'mid' };
  return { bg: 'bg-red-50', text: 'text-red-700', label: 'low' };
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
      nav={<AdminNav />}
    >
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">
        {t('admin.attendance.title')}
      </h2>

      <section className="ss-card flex items-center gap-4 p-4 sm:p-5">
        <AttendanceRing pct={overallPct} size={112} strokeWidth={12} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
            {t('admin.attendance.overviewKicker')}
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">
            {overallPct === null
              ? t('admin.attendance.noData')
              : t('admin.attendance.overviewValue', { pct: overallPct })}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {t('admin.attendance.overviewDetail', {
              present: overallPresent,
              total: overallTotal
            })}
          </p>
          {attentionGroups.length > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden />
              {t('admin.attendance.attentionNeeded', {
                count: attentionGroups.length
              })}
            </p>
          ) : null}
        </div>
      </section>

      <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {t('admin.attendance.pickGroup')}
      </h3>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {t('admin.attendance.emptyGroups')}{' '}
          <Link
            href="/admin/groups/new"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {t('admin.groups.new')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((g) => {
            const band = bandColor(g.pct);
            return (
              <li key={g.id}>
                <Link
                  href={`/admin/attendance/${g.id}`}
                  className="group flex items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-pop"
                >
                  <AttendanceRing pct={g.pct} size={72} strokeWidth={8} />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 truncate font-semibold text-slate-900">
                          {g.name}
                        </p>
                        {g.pct !== null ? (
                          <span
                            className={`ss-pill shrink-0 ${band.bg} ${band.text}`}
                          >
                            {g.pct}%
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t('admin.groups.studentsCount', { count: g.students })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('admin.attendance.sessionsSummary', {
                          scheduled: g.counts.scheduled,
                          held: g.counts.held
                        })}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {g.stats.total === 0
                          ? t('admin.attendance.noData')
                          : t('admin.attendance.attendanceRatio', {
                              present: g.stats.present,
                              total: g.stats.total
                            })}
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-slate-400 transition group-hover:text-slate-700"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
