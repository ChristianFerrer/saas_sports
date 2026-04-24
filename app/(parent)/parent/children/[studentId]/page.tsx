import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckSquare, Target } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { ParentNav } from '@/components/ui/parent-nav';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type StudentRow = {
  id: string;
  full_name: string;
  group_id: string | null;
};

type LinkRow = { student_id: string };

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  group_id: string;
};

type AttendanceRow = {
  session_id: string;
  present: boolean;
  coach_notes: string | null;
};

type CurrentObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
};

type ParentAchievementRow = {
  objective_id: string;
  achieved_at: string;
  objectives: {
    id: string;
    title: string;
    description: string | null;
    group_id: string;
  } | null;
};

export default async function ParentChildPage({
  params
}: {
  params: { studentId: string };
}) {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: link } = await supabase
    .from('student_parents')
    .select('student_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', params.studentId)
    .maybeSingle();

  if (!link) notFound();

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, group_id')
    .eq('id', params.studentId)
    .maybeSingle();

  const s = student as StudentRow | null;
  if (!s) notFound();

  const [
    groupResult,
    sessionsResult,
    attendanceResult,
    currentObjectivesResult,
    achievementsResult
  ] = await Promise.all([
    s.group_id
      ? supabase.from('groups').select('id, name').eq('id', s.group_id).maybeSingle()
      : Promise.resolve({ data: null as { id: string; name: string } | null }),
    s.group_id
      ? supabase
          .from('class_sessions')
          .select('id, scheduled_at, duration_minutes, status, group_id')
          .eq('group_id', s.group_id)
          .order('scheduled_at', { ascending: false })
      : Promise.resolve({ data: [] as SessionRow[] }),
    supabase
      .from('attendances')
      .select('session_id, present, coach_notes')
      .eq('student_id', s.id),
    s.group_id
      ? supabase
          .from('objectives')
          .select('id, title, description, display_order')
          .eq('group_id', s.group_id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as CurrentObjectiveRow[] }),
    supabase
      .from('student_objectives')
      .select(
        'objective_id, achieved_at, objectives (id, title, description, group_id)'
      )
      .eq('student_id', s.id)
      .order('achieved_at', { ascending: false })
  ]);

  const groupName = (groupResult.data as { name: string } | null)?.name ?? null;
  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const currentObjectives = (currentObjectivesResult.data ?? []) as CurrentObjectiveRow[];
  const achievements = (achievementsResult.data ?? []) as unknown as ParentAchievementRow[];
  const achievedIds = new Set(achievements.map((a) => a.objective_id));

  const historicalAchievements = achievements.filter(
    (a) => a.objectives && a.objectives.group_id !== s.group_id
  );
  const historicalGroupIds = Array.from(
    new Set(historicalAchievements.map((a) => a.objectives?.group_id).filter((g): g is string => !!g))
  );
  const historicalGroupsById = new Map<string, string>();
  if (historicalGroupIds.length > 0) {
    const { data: hist } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', historicalGroupIds);
    for (const g of (hist ?? []) as Array<{ id: string; name: string }>) {
      historicalGroupsById.set(g.id, g.name);
    }
  }

  const attendanceBySession = new Map<string, AttendanceRow>();
  for (const a of (attendanceResult.data ?? []) as AttendanceRow[]) {
    attendanceBySession.set(a.session_id, a);
  }

  const recorded = sessions.filter((ss) => attendanceBySession.has(ss.id));
  const pct = (() => {
    if (recorded.length === 0) return null;
    const present = recorded.filter((ss) => attendanceBySession.get(ss.id)?.present).length;
    return Math.round((present / recorded.length) * 100);
  })();

  return (
    <AppShell
      title={s.full_name}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
      nav={<ParentNav />}
    >
      <div className="mb-4">
        <Link href="/parent" className="text-xs text-slate-500 hover:text-slate-700">
          ← {t('parent.home.title')}
        </Link>
        <h2 className="text-xl font-semibold text-slate-900">{s.full_name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {groupName ?? t('admin.students.unassigned')}
        </p>
        {pct !== null ? (
          <p className="mt-2 text-sm text-slate-700">
            {t('parent.attendance.summary', {
              pct,
              present: recorded.filter((ss) => attendanceBySession.get(ss.id)?.present).length,
              total: recorded.length
            })}
          </p>
        ) : null}
      </div>

      {currentObjectives.length > 0 || historicalAchievements.length > 0 ? (
        <>
          {currentObjectives.length > 0 ? (
            <>
              <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <Target size={14} strokeWidth={2.4} aria-hidden />
                {t('parent.objectives.current', {
                  group: groupName ?? t('admin.students.unassigned')
                })}
              </h3>
              <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
                {currentObjectives.map((o) => {
                  const achieved = achievedIds.has(o.id);
                  return (
                    <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                      <span
                        aria-hidden
                        className={
                          achieved
                            ? 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white'
                            : 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-slate-300'
                        }
                      >
                        {achieved ? <CheckSquare size={14} strokeWidth={2.6} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            achieved
                              ? 'truncate font-semibold text-slate-900'
                              : 'truncate font-medium text-slate-700'
                          }
                        >
                          {o.title}
                        </p>
                        {o.description ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                            {o.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={
                          achieved
                            ? 'ss-pill bg-emerald-50 text-emerald-700'
                            : 'ss-pill bg-slate-100 text-slate-600'
                        }
                      >
                        {achieved
                          ? t('parent.objectives.statusAchieved')
                          : t('parent.objectives.statusPending')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {historicalAchievements.length > 0 ? (
            <>
              <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <Target size={14} strokeWidth={2.4} aria-hidden />
                {t('parent.objectives.historical')}
              </h3>
              <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
                {historicalAchievements.map((a) => {
                  const obj = a.objectives!;
                  const gName = historicalGroupsById.get(obj.group_id) ?? '—';
                  return (
                    <li
                      key={`${obj.id}-${a.achieved_at}`}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                        <CheckSquare size={14} strokeWidth={2.6} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {obj.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {gName} ·{' '}
                          {format.dateTime(new Date(a.achieved_at), {
                            dateStyle: 'medium'
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </>
      ) : null}

      <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        <CheckSquare size={14} strokeWidth={2.4} aria-hidden />
        {t('parent.attendance.historyTitle')}
      </h3>
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {t('parent.attendance.empty')}
        </div>
      ) : (
        <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
          {sessions.map((ss) => {
            const att = attendanceBySession.get(ss.id);
            const display = format.dateTime(new Date(ss.scheduled_at), {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'UTC'
            });
            return (
              <li key={ss.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{display}</p>
                  <p className="text-xs text-slate-500">
                    {t(`admin.attendance.status.${ss.status}`)} · {ss.duration_minutes}{' '}
                    {t('admin.attendance.minutes')}
                  </p>
                  {att?.coach_notes ? (
                    <p className="mt-1 text-sm text-slate-700">{att.coach_notes}</p>
                  ) : null}
                </div>
                <div className="shrink-0">
                  {att ? (
                    <span
                      className={
                        att.present
                          ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
                          : 'inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'
                      }
                    >
                      {att.present
                        ? t('parent.attendance.present')
                        : t('parent.attendance.absent')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {t('parent.attendance.pending')}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
