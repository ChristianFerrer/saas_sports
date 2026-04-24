'use server';

import { redirect } from 'next/navigation';

import { createClient as createBrowserSessionClient } from '@/lib/supabase/server';
import { createUntypedServiceClient } from '@/lib/supabase/service';

export type AcceptInvitationFormState = { error?: string };

type InvitationRow = {
  id: string;
  school_id: string;
  email: string;
  role: 'admin' | 'coach' | 'parent';
  full_name: string;
  student_id: string | null;
  expires_at: string;
  accepted_at: string | null;
};

function rolePath(role: 'admin' | 'coach' | 'parent'): string {
  return role === 'admin' ? '/admin' : role === 'coach' ? '/coach' : '/parent';
}

export async function acceptInvitation(
  token: string,
  _prev: AcceptInvitationFormState,
  formData: FormData
): Promise<AcceptInvitationFormState> {
  const password = String(formData.get('password') ?? '');
  const passwordConfirm = String(formData.get('password_confirm') ?? '');

  if (password.length < 8) return { error: 'weakPassword' };
  if (password !== passwordConfirm) return { error: 'passwordsMismatch' };

  const admin = createUntypedServiceClient();

  const { data: inv, error: invErr } = await admin
    .from('invitations')
    .select(
      'id, school_id, email, role, full_name, student_id, expires_at, accepted_at'
    )
    .eq('token', token)
    .maybeSingle();

  if (invErr) return { error: invErr.message };
  const invitation = inv as InvitationRow | null;
  if (!invitation) return { error: 'invalidToken' };
  if (invitation.accepted_at) return { error: 'alreadyAccepted' };
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return { error: 'expired' };
  }

  let userId: string;
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });
  if (listErr) return { error: listErr.message };
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === invitation.email.toLowerCase()
  );

  if (existing) {
    const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
      password
    });
    if (updErr) return { error: updErr.message };
    userId = existing.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invitation.full_name }
    });
    if (createErr) return { error: createErr.message };
    userId = created.user.id;
  }

  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      user_id: userId,
      school_id: invitation.school_id,
      role: invitation.role,
      full_name: invitation.full_name
    },
    { onConflict: 'user_id' }
  );
  if (profileErr) return { error: profileErr.message };

  if (invitation.role === 'parent' && invitation.student_id) {
    const { error: linkErr } = await admin.from('student_parents').upsert(
      {
        student_id: invitation.student_id,
        parent_user_id: userId,
        relationship: null
      },
      { onConflict: 'student_id,parent_user_id' }
    );
    if (linkErr) return { error: linkErr.message };
  }

  const { error: markErr } = await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);
  if (markErr) console.error('[acceptInvitation] could not mark accepted', markErr);

  const session = createBrowserSessionClient();
  const { error: signInErr } = await session.auth.signInWithPassword({
    email: invitation.email,
    password
  });
  if (signInErr) {
    console.error('[acceptInvitation] sign-in after accept failed', signInErr);
    redirect('/login?error=accepted_signin_failed');
  }

  redirect(rolePath(invitation.role));
}
