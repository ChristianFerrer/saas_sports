import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { saveAttendance } from '@/app/(admin)/admin/attendance/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { AttendanceSheet } from '@/components/admin/attendance-sheet';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type SessionRow = {
  id: string;
  group_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
};
type StudentRow = { id: string; full_name: string };
type AttendanceRow = { student_id: string; present: boolean; coach_notes: string | null };

export default async function AttendanceSheetPage({
  params
}: {
  params: { groupId: string; sessionId: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const [groupResult, sessionResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, school_id')
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

  if (!g || !s || g.school_id !== user.profile.school_id || s.group_id !== g.id) {
    notFound();
  }

  const [studentsResult, attendanceResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name')
      .eq('group_id', g.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('attendances')
      .select('student_id, present, coach_notes')
      .eq('session_id', s.id)
  ]);

  const students = (studentsResult.data ?? []) as StudentRow[];
  const existing = new Map<string, { present: boolean; notes: string }>();
  for (const a of (attendanceResult.data ?? []) as AttendanceRow[]) {
    existing.set(a.student_id, { present: a.present, notes: a.coach_notes ?? '' });
  }

  const display = format.dateTime(new Date(s.scheduled_at), {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  });

  const action = saveAttendance.bind(null, g.id, s.id);

  return (
    <AppShell
      title={display}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4">
        <Link
          href={`/admin/attendance/${g.id}`}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← {g.name}
        </Link>
        <h2 className="text-xl font-semibold text-slate-900">
          {t('admin.attendance.sheetTitle')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {display} · {s.duration_minutes} {t('admin.attendance.minutes')} ·{' '}
          {t(`admin.attendance.status.${s.status}`)}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('admin.attendance.noStudentsInGroup')}
        </div>
      ) : (
        <AttendanceSheet
          action={action}
          students={students.map((st) => ({
            id: st.id,
            fullName: st.full_name,
            present: existing.get(st.id)?.present ?? true,
            notes: existing.get(st.id)?.notes ?? ''
          }))}
          submitLabel={t('common.save')}
          savedLabel={t('admin.attendance.saved')}
        />
      )}
    </AppShell>
  );
}
