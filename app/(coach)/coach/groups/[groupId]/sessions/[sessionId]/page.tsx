import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { saveCoachAttendance } from '@/app/(coach)/coach/actions';
import { AttendanceSheet } from '@/components/admin/attendance-sheet';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; coach_id: string | null };
type SessionRow = {
  id: string;
  group_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
};
type StudentRow = { id: string; full_name: string };
type AttendanceRow = {
  student_id: string;
  present: boolean;
  coach_notes: string | null;
  mood: number | null;
};

export default async function CoachAttendanceSheetPage({
  params
}: {
  params: { groupId: string; sessionId: string };
}) {
  const user = await requireRole('coach');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const [groupResult, sessionResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, coach_id')
      .eq('id', params.groupId)
      .maybeSingle(),
    supabase
      .from('class_sessions')
      .select('id, group_id, scheduled_at, duration_minutes, status')
      .eq('id', params.sessionId)
      .maybeSingle()
  ]);

  const g = groupResult.data as GroupRow | null;
  const s = sessionResult.data as SessionRow | null;

  if (!g || !s || g.coach_id !== user.id || s.group_id !== g.id) notFound();

  const [studentsResult, attendanceResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name')
      .eq('group_id', g.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('attendances')
      .select('student_id, present, coach_notes, mood')
      .eq('session_id', s.id)
  ]);

  const students = (studentsResult.data ?? []) as StudentRow[];
  const existing = new Map<
    string,
    { present: boolean; notes: string; mood: 0 | 1 | 2 | null }
  >();
  for (const a of (attendanceResult.data ?? []) as AttendanceRow[]) {
    const mood = a.mood === 0 || a.mood === 1 || a.mood === 2 ? (a.mood as 0 | 1 | 2) : null;
    existing.set(a.student_id, {
      present: a.present,
      notes: a.coach_notes ?? '',
      mood
    });
  }

  const display = format.dateTime(new Date(s.scheduled_at), {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  });

  const action = saveCoachAttendance.bind(null, g.id, s.id);

  return (
    <AppShell
      title={display}
      role={t('roles.coach')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4">
        <Link
          href={`/coach/groups/${g.id}`}
          className="text-xs text-ink-300 hover:text-ink-100"
        >
          ← {g.name}
        </Link>
        <h2 className="text-xl font-semibold text-ink-50">
          {t('admin.attendance.sheetTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-200">
          {display} · {s.duration_minutes} {t('admin.attendance.minutes')} ·{' '}
          {t(`admin.attendance.status.${s.status}`)}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white p-6 text-sm text-ink-300">
          {t('admin.attendance.noStudentsInGroup')}
        </div>
      ) : (
        <AttendanceSheet
          action={action}
          students={students.map((st) => ({
            id: st.id,
            fullName: st.full_name,
            present: existing.get(st.id)?.present ?? true,
            notes: existing.get(st.id)?.notes ?? '',
            mood: existing.get(st.id)?.mood ?? null
          }))}
          submitLabel={t('common.save')}
          savedLabel={t('admin.attendance.saved')}
        />
      )}
    </AppShell>
  );
}
