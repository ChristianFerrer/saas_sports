'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';
import type { GroupScheduleEntry } from '@/types/database';

export type GroupFormState = { error?: string };

function parseSchedule(raw: string | null): GroupScheduleEntry[] | null {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const result: GroupScheduleEntry[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return null;
    const it = item as Record<string, unknown>;
    const weekday = Number(it.weekday);
    const duration = Number(it.duration_minutes);
    const start = typeof it.start_time === 'string' ? it.start_time : '';
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
    if (!/^\d{2}:\d{2}$/.test(start)) return null;
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) return null;
    result.push({
      weekday: weekday as GroupScheduleEntry['weekday'],
      start_time: start,
      duration_minutes: duration
    });
  }
  return result;
}

export async function createGroup(
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const user = await requireRole('admin');
  const name = String(formData.get('name') ?? '').trim();

  if (!name) return { error: 'nameRequired' };

  const supabase = createUntypedClient();
  const { data, error } = await supabase
    .from('groups')
    .insert({ school_id: user.profile.school_id, name })
    .select('id')
    .single();

  if (error) {
    console.error('[createGroup] insert failed', {
      school_id: user.profile.school_id,
      name,
      error
    });
    return { error: error.message };
  }

  if (!data) {
    console.error('[createGroup] insert returned no row (RLS?)', {
      school_id: user.profile.school_id,
      name
    });
    return { error: 'insertFailed' };
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin');
  redirect('/admin/groups');
}

export async function updateGroup(
  id: string,
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  await requireRole('admin');
  const name = String(formData.get('name') ?? '').trim();

  if (!name) return { error: 'nameRequired' };

  const scheduleRaw = formData.get('schedule_json');
  const schedule = parseSchedule(
    typeof scheduleRaw === 'string' ? scheduleRaw : null
  );
  if (schedule === null) return { error: 'scheduleInvalid' };

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('groups')
    .update({ name, schedule })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/groups');
  revalidatePath(`/admin/groups/${id}/edit`);
  redirect('/admin/groups');
}

export async function deleteGroup(id: string): Promise<void> {
  await requireRole('admin');

  const supabase = createUntypedClient();

  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', id);

  if (count && count > 0) {
    redirect(`/admin/groups?error=hasStudents`);
  }

  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) redirect(`/admin/groups?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/admin/groups');
  revalidatePath('/admin');
  redirect('/admin/groups');
}
