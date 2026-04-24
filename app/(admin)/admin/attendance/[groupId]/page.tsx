import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { DeleteSessionButton } from '@/components/admin/delete-session-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  notes: string | null;
};
type AttendanceCountRow = { session_id: string; present: boolean };
type SearchParams = { error?: string };

export default async function AdminAttendanceGroupPage({
  params,
  searchParams
}: {
  params: { groupId: string };
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, school_id')
    .eq('id', params.groupId)
    .maybeSingle();

  const g = group as GroupRow | null;
  if (!g || g.school_id !== user.profile.school_id) notFound();

  const [sessionsResult, attendanceResult, studentsResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, scheduled_at, duration_minutes, status, notes')
      .eq('group_id', params.groupId)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('attendances')
      .select('session_id, present'),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', params.groupId)
  ]);

  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const attendanceRows = (attendanceResult.data ?? []) as AttendanceCountRow[];
  const studentCount = studentsResult.count ?? 0;

  const presentBySession = new Map<string, { present: number; total: number }>();
  for (const a of attendanceRows) {
    const curr = presentBySession.get(a.session_id) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (a.present) curr.present += 1;
    presentBySession.set(a.session_id, curr);
  }

  const now = Date.now();
  const upcoming = sessions
    .filter((s) => new Date(s.scheduled_at).getTime() >= now)
    .slice()
    .reverse();
  const past = sessions.filter((s) => new Date(s.scheduled_at).getTime() < now);

  const errorMessage = searchParams.error;

  return (
    <AppShell
      title={g.name}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href="/admin/attendance"
            className="text-xs text-ink-300 hover:text-ink-100"
          >
            ← {t('admin.attendance.title')}
          </Link>
          <h2 className="text-xl font-semibold text-ink-50">
            {t('admin.attendance.groupTitle', { name: g.name })}
          </h2>
        </div>
        <Link
          href={`/admin/attendance/${g.id}/new`}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.attendance.newSession')}
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-500/15 p-3 text-sm text-red-200"
        >
          {errorMessage}
        </div>
      ) : null}

      {studentCount === 0 ? (
        <div className="mb-4 rounded-md bg-amber-500/15 p-3 text-sm text-amber-200">
          {t('admin.attendance.noStudentsWarning')}
        </div>
      ) : null}

      <SectionTitle>{t('admin.attendance.upcoming')}</SectionTitle>
      {upcoming.length === 0 ? (
        <EmptyBox>{t('admin.attendance.noUpcoming')}</EmptyBox>
      ) : (
        <SessionList
          sessions={upcoming}
          groupId={g.id}
          format={format}
          t={t}
          counts={presentBySession}
          confirmDelete={(name) => t('admin.attendance.deleteConfirm', { name })}
        />
      )}

      <div className="h-6" />

      <SectionTitle>{t('admin.attendance.past')}</SectionTitle>
      {past.length === 0 ? (
        <EmptyBox>{t('admin.attendance.noPast')}</EmptyBox>
      ) : (
        <SessionList
          sessions={past}
          groupId={g.id}
          format={format}
          t={t}
          counts={presentBySession}
          confirmDelete={(name) => t('admin.attendance.deleteConfirm', { name })}
        />
      )}
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">
      {children}
    </h3>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white p-4 text-sm text-ink-300">
      {children}
    </div>
  );
}

function statusPillClass(status: SessionRow['status']): string {
  switch (status) {
    case 'held':
      return 'ss-pill bg-emerald-500/15 text-gold-300';
    case 'cancelled':
      return 'ss-pill bg-red-500/15 text-red-300';
    default:
      return 'ss-pill bg-white/[0.04] text-ink-100';
  }
}

function SessionList({
  sessions,
  groupId,
  format,
  t,
  counts,
  confirmDelete
}: {
  sessions: SessionRow[];
  groupId: string;
  format: Awaited<ReturnType<typeof getFormatter>>;
  t: Awaited<ReturnType<typeof getTranslations>>;
  counts: Map<string, { present: number; total: number }>;
  confirmDelete: (name: string) => string;
}) {
  return (
    <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
      {sessions.map((s) => {
        const date = new Date(s.scheduled_at);
        const display = format.dateTime(date, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC'
        });
        const cnt = counts.get(s.id);
        return (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink-50">{display}</p>
              <p className="text-xs text-ink-300">
                {s.duration_minutes} {t('admin.attendance.minutes')}
                {cnt
                  ? ` · ${t('admin.attendance.attendanceRatio', {
                      present: cnt.present,
                      total: cnt.total
                    })}`
                  : ''}
              </p>
              {s.notes ? (
                <p className="mt-1 truncate text-xs text-ink-200">{s.notes}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className={statusPillClass(s.status)}>
                {t(`admin.attendance.status.${s.status}`)}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/attendance/${groupId}/sessions/${s.id}`}
                  className="text-sm font-medium text-gold-300 hover:text-gold-200"
                >
                  {t('admin.attendance.open')}
                </Link>
                <DeleteSessionButton
                  groupId={groupId}
                  sessionId={s.id}
                  confirmMessage={confirmDelete(display)}
                  label={t('common.delete')}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
