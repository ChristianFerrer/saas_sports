'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type CoachAttendanceFormState = { error?: string; savedAt?: number };

export async function saveCoachAttendance(
  groupId: string,
  sessionId: string,
  _prev: CoachAttendanceFormState,
  formData: FormData
): Promise<CoachAttendanceFormState> {
  const user = await requireRole('coach');
  const supabase = createUntypedClient();

  const { data: session, error: sessionErr } = await supabase
    .from('class_sessions')
    .select('id, group_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionErr) return { error: sessionErr.message };
  if (!session || session.group_id !== groupId) return { error: 'sessionNotFound' };

  const { data: students, error: stuErr } = await supabase
    .from('students')
    .select('id')
    .eq('group_id', groupId);

  if (stuErr) {
    console.error('[saveCoachAttendance] fetch students failed', { groupId, error: stuErr });
    return { error: stuErr.message };
  }

  const rows = (students ?? []).map((s: { id: string }) => {
    const rawNotes = String(formData.get(`notes_${s.id}`) ?? '').trim();
    return {
      session_id: sessionId,
      student_id: s.id,
      present: formData.get(`present_${s.id}`) === 'on',
      coach_notes: rawNotes === '' ? null : rawNotes,
      created_by: user.id
    };
  });

  if (rows.length === 0) return { error: 'noStudents' };

  const { error: upsertErr } = await supabase
    .from('attendances')
    .upsert(rows, { onConflict: 'session_id,student_id' });

  if (upsertErr) {
    console.error('[saveCoachAttendance] upsert failed', { sessionId, error: upsertErr });
    return { error: upsertErr.message };
  }

  const { error: statusErr } = await supabase
    .from('class_sessions')
    .update({ status: 'held' })
    .eq('id', sessionId);

  if (statusErr) {
    console.error('[saveCoachAttendance] status update failed', { sessionId, error: statusErr });
  }

  revalidatePath(`/coach/groups/${groupId}`);
  revalidatePath(`/coach/groups/${groupId}/sessions/${sessionId}`);
  return { savedAt: Date.now() };
}
