'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { sendInvitationEmail } from '@/lib/email/invitations';
import { generateInvitationToken } from '@/lib/invitations/tokens';
import { createUntypedClient } from '@/lib/supabase/server';

export type InvitationFormState = {
  error?: string;
  createdLink?: string;
  emailStatus?: 'sent' | 'skipped' | 'failed';
};

type SchoolRow = { id: string; name: string };
type StudentRow = { id: string; school_id: string };

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function createInvitation(
  _prev: InvitationFormState,
  formData: FormData
): Promise<InvitationFormState> {
  const user = await requireRole('admin');

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();
  const studentIdRaw = String(formData.get('student_id') ?? '').trim();

  if (!email || !/.+@.+\..+/.test(email)) return { error: 'emailInvalid' };
  if (!fullName) return { error: 'fullNameRequired' };
  if (role !== 'coach' && role !== 'parent') return { error: 'roleInvalid' };
  if (role === 'parent' && !studentIdRaw) return { error: 'studentRequired' };

  const supabase = createUntypedClient();

  if (role === 'parent') {
    const { data: stu } = await supabase
      .from('students')
      .select('id, school_id')
      .eq('id', studentIdRaw)
      .maybeSingle();
    const s = stu as StudentRow | null;
    if (!s || s.school_id !== user.profile.school_id) return { error: 'studentNotFound' };
  }

  const { data: dup } = await supabase
    .from('invitations')
    .select('id')
    .eq('school_id', user.profile.school_id)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  if (dup && dup.length > 0) return { error: 'alreadyInvited' };

  const token = generateInvitationToken();

  const { error } = await supabase.from('invitations').insert({
    school_id: user.profile.school_id,
    email,
    role,
    full_name: fullName,
    student_id: role === 'parent' ? studentIdRaw : null,
    token,
    created_by: user.id
  });

  if (error) {
    console.error('[createInvitation] insert failed', { error });
    return { error: error.message };
  }

  const { data: school } = await supabase
    .from('schools')
    .select('id, name')
    .eq('id', user.profile.school_id)
    .maybeSingle();
  const schoolName = (school as SchoolRow | null)?.name ?? 'SmartSpots';

  const acceptUrl = `${appUrl()}/invite/${token}`;

  const emailResult = await sendInvitationEmail({
    to: email,
    fullName,
    schoolName,
    role: role as 'coach' | 'parent',
    acceptUrl
  });

  let emailStatus: InvitationFormState['emailStatus'] = 'sent';
  if (!emailResult.ok) {
    emailStatus = emailResult.skipped ? 'skipped' : 'failed';
    console.log('[createInvitation] email not sent', emailResult);
  }

  revalidatePath('/admin/invitations');
  return { createdLink: acceptUrl, emailStatus };
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await requireRole('admin');
  const supabase = createUntypedClient();
  const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
  if (error) {
    console.error('[revokeInvitation] delete failed', { invitationId, error });
    redirect(`/admin/invitations?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/admin/invitations');
  redirect('/admin/invitations');
}
