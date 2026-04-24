import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { DeleteSessionButton } from '@/components/admin/delete-session-button';
import { AdminNav } from '@/components/admin/admin-nav';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
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
      .select('id, scheduled_at, duration_minutes, status')
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
  const upcoming = sessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() >= now
  );
  const past = sessions.filter((s) => !upcoming.includes(s));

  const errorMessage = searchParams.error;

  return (
    <AppShell
      title={g.name}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href="/admin/attendance"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← {t('admin.attendance.title')}
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">
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
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {studentCount === 0 ? (
        <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
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
                {t('admin.attendance.statusLabel')}:{' '}
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
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/attendance/${groupId}/sessions/${s.id}`}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
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
          </li>
        );
      })}
    </ul>
  );
}
