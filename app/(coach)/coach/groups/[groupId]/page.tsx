import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; coach_id: string | null };
type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
};
type AttendanceCountRow = { session_id: string; present: boolean };

export default async function CoachGroupSessionsPage({
  params
}: {
  params: { groupId: string };
}) {
  const user = await requireRole('coach');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, coach_id')
    .eq('id', params.groupId)
    .maybeSingle();

  const g = group as GroupRow | null;
  if (!g || g.coach_id !== user.id) notFound();

  const [sessionsResult, attendanceResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('group_id', g.id)
      .order('scheduled_at', { ascending: false }),
    supabase.from('attendances').select('session_id, present')
  ]);

  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const attendanceRows = (attendanceResult.data ?? []) as AttendanceCountRow[];

  const presentBySession = new Map<string, { present: number; total: number }>();
  for (const a of attendanceRows) {
    const curr = presentBySession.get(a.session_id) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (a.present) curr.present += 1;
    presentBySession.set(a.session_id, curr);
  }

  const now = Date.now();
  const upcoming = sessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() >= now
  );
  const past = sessions.filter((s) => !upcoming.includes(s));

  return (
    <AppShell
      title={g.name}
      role={t('roles.coach')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4">
        <Link href="/coach" className="text-xs text-slate-500 hover:text-slate-700">
          ← {t('coach.home.title')}
        </Link>
        <h2 className="text-xl font-semibold text-slate-900">{g.name}</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('coach.sessions.empty')}
        </div>
      ) : (
        <>
          <SectionTitle>{t('coach.sessions.upcoming')}</SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyBox>{t('coach.sessions.noUpcoming')}</EmptyBox>
          ) : (
            <SessionList
              sessions={upcoming}
              groupId={g.id}
              format={format}
              t={t}
              counts={presentBySession}
            />
          )}

          <div className="h-6" />

          <SectionTitle>{t('coach.sessions.past')}</SectionTitle>
          {past.length === 0 ? (
            <EmptyBox>{t('coach.sessions.noPast')}</EmptyBox>
          ) : (
            <SessionList
              sessions={past}
              groupId={g.id}
              format={format}
              t={t}
              counts={presentBySession}
            />
          )}
        </>
      )}
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
      {children}
    </div>
  );
}

function SessionList({
  sessions,
  groupId,
  format,
  t,
  counts
}: {
  sessions: SessionRow[];
  groupId: string;
  format: Awaited<ReturnType<typeof getFormatter>>;
  t: Awaited<ReturnType<typeof getTranslations>>;
  counts: Map<string, { present: number; total: number }>;
}) {
  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {sessions.map((s) => {
        const date = new Date(s.scheduled_at);
        const display = format.dateTime(date, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC'
        });
        const cnt = counts.get(s.id);
        return (
          <li key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{display}</p>
              <p className="text-xs text-slate-500">
                {t(`admin.attendance.status.${s.status}`)} · {s.duration_minutes}{' '}
                {t('admin.attendance.minutes')}
                {cnt
                  ? ` · ${t('admin.attendance.attendanceRatio', {
                      present: cnt.present,
                      total: cnt.total
                    })}`
                  : ''}
              </p>
            </div>
            <Link
              href={`/coach/groups/${groupId}/sessions/${s.id}`}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              {t('admin.attendance.open')}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
