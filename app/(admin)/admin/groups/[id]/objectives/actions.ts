'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type ObjectiveFormState = { error?: string };

export async function createObjective(
  groupId: string,
  _prev: ObjectiveFormState,
  formData: FormData
): Promise<ObjectiveFormState> {
  await requireRole('admin');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!title) return { error: 'titleRequired' };

  const supabase = createUntypedClient();

  const { data: maxRow } = await supabase
    .from('objectives')
    .select('display_order')
    .eq('group_id', groupId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    (maxRow as { display_order: number } | null)?.display_order != null
      ? ((maxRow as { display_order: number }).display_order ?? 0) + 1
      : 0;

  const { data, error } = await supabase
    .from('objectives')
    .insert({
      group_id: groupId,
      title,
      description: description === '' ? null : description,
      display_order: nextOrder
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createObjective] insert failed', { groupId, error });
    return { error: error.message };
  }
  if (!data) return { error: 'insertFailed' };

  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}/objectives`);
  redirect(`/admin/groups/${groupId}/objectives`);
}

export async function updateObjective(
  groupId: string,
  objectiveId: string,
  _prev: ObjectiveFormState,
  formData: FormData
): Promise<ObjectiveFormState> {
  await requireRole('admin');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!title) return { error: 'titleRequired' };

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('objectives')
    .update({
      title,
      description: description === '' ? null : description
    })
    .eq('id', objectiveId);

  if (error) {
    console.error('[updateObjective] update failed', { objectiveId, error });
    return { error: error.message };
  }

  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}/objectives`);
  redirect(`/admin/groups/${groupId}/objectives`);
}

export async function deleteObjective(
  groupId: string,
  objectiveId: string
): Promise<void> {
  await requireRole('admin');
  const supabase = createUntypedClient();

  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', objectiveId);

  if (error) {
    console.error('[deleteObjective] delete failed', { objectiveId, error });
    redirect(
      `/admin/groups/${groupId}/objectives?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}/objectives`);
  redirect(`/admin/groups/${groupId}/objectives`);
}
