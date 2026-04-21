'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
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
  const { error } = await supabase
    .from('groups')
    .insert({ school_id: user.profile.school_id, name });

  if (error) return { error: error.message };

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

  const supabase = createUntypedClient();
  const { error } = await supabase.from('groups').update({ name }).eq('id', id);

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
