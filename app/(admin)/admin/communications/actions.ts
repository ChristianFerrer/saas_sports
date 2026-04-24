'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type CommunicationFormState = { error?: string };

type ParentLinkRow = {
  parent_user_id: string;
  students: { group_id: string | null } | null;
};

type ProfileRow = { user_id: string };

export async function sendCommunication(
  _prev: CommunicationFormState,
  formData: FormData
): Promise<CommunicationFormState> {
  const user = await requireRole('admin');

  const subject = String(formData.get('subject') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const audience = String(formData.get('audience') ?? '').trim();
  const groupIdRaw = String(formData.get('group_id') ?? '').trim();

  if (!subject) return { error: 'subjectRequired' };
  if (!content) return { error: 'contentRequired' };
  if (audience !== 'school' && audience !== 'group') return { error: 'audienceInvalid' };
  if (audience === 'group' && !groupIdRaw) return { error: 'groupRequired' };

  const supabase = createUntypedClient();
  const groupId = audience === 'group' ? groupIdRaw : null;

  let parentUserIds: string[] = [];

  if (audience === 'school') {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('school_id', user.profile.school_id)
      .eq('role', 'parent');
    if (error) return { error: error.message };
    parentUserIds = (data ?? []).map((p: ProfileRow) => p.user_id);
  } else {
    const { data, error } = await supabase
      .from('student_parents')
      .select('parent_user_id, students!inner (group_id)')
      .eq('students.group_id', groupId);
    if (error) return { error: error.message };
    const rows = (data ?? []) as unknown as ParentLinkRow[];
    parentUserIds = Array.from(new Set(rows.map((r) => r.parent_user_id)));
  }

  if (parentUserIds.length === 0) return { error: 'noRecipients' };

  const nowIso = new Date().toISOString();

  const { data: created, error: insertErr } = await supabase
    .from('communications')
    .insert({
      school_id: user.profile.school_id,
      group_id: groupId,
      subject,
      content,
      sent_by: user.id,
      sent_at: nowIso
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[sendCommunication] insert failed', insertErr);
    return { error: insertErr.message };
  }
  if (!created) return { error: 'insertFailed' };

  const recipients = parentUserIds.map((pid) => ({
    communication_id: created.id,
    parent_user_id: pid,
    delivered_at: nowIso,
    read_at: null
  }));

  const { error: recipErr } = await supabase
    .from('communication_recipients')
    .insert(recipients);

  if (recipErr) {
    console.error('[sendCommunication] recipients insert failed', recipErr);
    return { error: recipErr.message };
  }

  revalidatePath('/admin/communications');
  revalidatePath('/parent/messages');
  redirect('/admin/communications');
}

export async function deleteCommunication(communicationId: string): Promise<void> {
  await requireRole('admin');
  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('communications')
    .delete()
    .eq('id', communicationId);
  if (error) {
    console.error('[deleteCommunication] delete failed', { communicationId, error });
    redirect(`/admin/communications?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/admin/communications');
  redirect('/admin/communications');
}
