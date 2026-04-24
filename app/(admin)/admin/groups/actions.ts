'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { parseSchedule } from '@/lib/groups/schedule';
import { createUntypedClient } from '@/lib/supabase/server';

export type GroupFormState = { error?: string };

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

function parseDate(raw: FormDataEntryValue | null): string | null | 'invalid' {
  const v = String(raw ?? '').trim();
  if (v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'invalid';
  const d = new Date(v + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return 'invalid';
  return v;
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

  const coachIdRaw = String(formData.get('coach_id') ?? '').trim();
  const coach_id = coachIdRaw === '' ? null : coachIdRaw;

  const start = parseDate(formData.get('start_date'));
  const end = parseDate(formData.get('end_date'));
  if (start === 'invalid' || end === 'invalid') return { error: 'dateInvalid' };
  if (start && end && start > end) return { error: 'dateRangeInvalid' };

  const orderRaw = String(formData.get('display_order') ?? '').trim();
  let displayOrder: number | null = null;
  if (orderRaw !== '') {
    const parsed = Number.parseInt(orderRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999) {
      return { error: 'orderInvalid' };
    }
    displayOrder = parsed;
  }

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('groups')
    .update({
      name,
      schedule,
      coach_id,
      start_date: start,
      end_date: end,
      ...(displayOrder !== null ? { display_order: displayOrder } : {})
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/groups');
  revalidatePath(`/admin/groups/${id}`);
  revalidatePath(`/admin/groups/${id}/edit`);
  redirect(`/admin/groups/${id}`);
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
