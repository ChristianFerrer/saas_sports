'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type SessionFormState = { error?: string };
export type AttendanceFormState = { error?: string; savedAt?: number };

export async function createSession(
  groupId: string,
  _prev: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  await requireRole('admin');

  const dateStr = String(formData.get('scheduled_at_date') ?? '').trim();
  const timeStr = String(formData.get('scheduled_at_time') ?? '').trim();
  const durationStr = String(formData.get('duration_minutes') ?? '60').trim();
  const statusRaw = String(formData.get('status') ?? 'scheduled').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();

  if (!dateStr || !timeStr) return { error: 'dateTimeRequired' };

  const duration = Number.parseInt(durationStr, 10);
  if (!Number.isFinite(duration) || duration <= 0) return { error: 'durationInvalid' };

  const status =
    statusRaw === 'cancelled' || statusRaw === 'held' ? statusRaw : 'scheduled';

  // TZ-naive: store the entered local time as if it were UTC. Display path
  // reads it back with timeZone:'UTC' for round-trip consistency. Proper
  // per-school TZ handling is tech debt (see CLAUDE.md §5).
  const scheduledAt = `${dateStr}T${timeStr}:00.000Z`;

  const supabase = createUntypedClient();
  const { data, error } = await supabase
    .from('class_sessions')
    .insert({
      group_id: groupId,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      status,
      notes: notesRaw === '' ? null : notesRaw
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createSession] insert failed', { groupId, error });
    if (error.code === '23505') return { error: 'duplicateSession' };
    return { error: error.message };
  }
  if (!data) return { error: 'insertFailed' };

  revalidatePath(`/admin/attendance/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/attendance/${groupId}/sessions/${data.id}`);
}

export async function saveAttendance(
  groupId: string,
  sessionId: string,
  _prev: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
  const user = await requireRole('admin');
  const supabase = createUntypedClient();

  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('group_id', groupId);

  if (sErr) {
    console.error('[saveAttendance] fetch students failed', { groupId, error: sErr });
    return { error: sErr.message };
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
    console.error('[saveAttendance] upsert failed', { sessionId, error: upsertErr });
    return { error: upsertErr.message };
  }

  const { error: statusErr } = await supabase
    .from('class_sessions')
    .update({ status: 'held' })
    .eq('id', sessionId);

  if (statusErr) {
    console.error('[saveAttendance] status update failed', { sessionId, error: statusErr });
  }

  revalidatePath(`/admin/attendance/${groupId}`);
  revalidatePath(`/admin/attendance/${groupId}/sessions/${sessionId}`);
  return { savedAt: Date.now() };
}

export async function editSession(
  groupId: string,
  sessionId: string,
  _prev: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  await requireRole('admin');

  const dateStr = String(formData.get('scheduled_at_date') ?? '').trim();
  const timeStr = String(formData.get('scheduled_at_time') ?? '').trim();
  const durationStr = String(formData.get('duration_minutes') ?? '60').trim();
  const statusRaw = String(formData.get('status') ?? 'scheduled').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();

  if (!dateStr || !timeStr) return { error: 'dateTimeRequired' };

  const duration = Number.parseInt(durationStr, 10);
  if (!Number.isFinite(duration) || duration <= 0) return { error: 'durationInvalid' };

  const status =
    statusRaw === 'cancelled' || statusRaw === 'held' ? statusRaw : 'scheduled';

  const scheduledAt = `${dateStr}T${timeStr}:00.000Z`;

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('class_sessions')
    .update({
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      status,
      notes: notesRaw === '' ? null : notesRaw
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[editSession] update failed', { sessionId, error });
    if (error.code === '23505') return { error: 'duplicateSession' };
    return { error: error.message };
  }

  revalidatePath(`/admin/attendance/${groupId}`);
  revalidatePath(`/admin/attendance/${groupId}/sessions/${sessionId}`);
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/attendance/${groupId}/sessions/${sessionId}`);
}

export async function cancelSession(groupId: string, sessionId: string): Promise<void> {
  await requireRole('admin');
  const supabase = createUntypedClient();

  const { error } = await supabase
    .from('class_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId);

  if (error) {
    console.error('[cancelSession] update failed', { sessionId, error });
    redirect(`/admin/attendance/${groupId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/attendance/${groupId}`);
  redirect(`/admin/attendance/${groupId}`);
}

export async function deleteSession(groupId: string, sessionId: string): Promise<void> {
  await requireRole('admin');
  const supabase = createUntypedClient();

  const { error } = await supabase.from('class_sessions').delete().eq('id', sessionId);

  if (error) {
    console.error('[deleteSession] delete failed', { sessionId, error });
    redirect(`/admin/attendance/${groupId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/attendance/${groupId}`);
  redirect(`/admin/attendance/${groupId}`);
}
