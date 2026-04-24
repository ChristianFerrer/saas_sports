import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
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

  const [groupResult, sessionsResult, attendanceResult] = await Promise.all([
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
      .eq('student_id', s.id)
  ]);

  const groupName = (groupResult.data as { name: string } | null)?.name ?? null;
  const sessions = (sessionsResult.data ?? []) as SessionRow[];
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

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('parent.attendance.empty')}
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
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
