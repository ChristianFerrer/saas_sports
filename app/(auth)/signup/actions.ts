'use server';

import { createUntypedServiceClient } from '@/lib/supabase/service';

export type SignupResult = { ok: true } | { ok: false; error: string };

export async function createAccount(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();
  const schoolName = String(formData.get('school_name') ?? '').trim();

  if (!email || !password || !fullName || !schoolName) {
    return { ok: false, error: 'required_field' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'weak_password' };
  }

  const supabase = createUntypedServiceClient();

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError || !createData.user) {
    const message = createError?.message ?? 'unknown';
    if (/already registered|already exists|duplicate/i.test(message)) {
      return { ok: false, error: 'email_taken' };
    }
    if (/password/i.test(message) && /short|weak|length/i.test(message)) {
      return { ok: false, error: 'weak_password' };
    }
    return { ok: false, error: message };
  }

  const userId = createData.user.id;

  const { data: schoolRow, error: schoolError } = await supabase
    .from('schools')
    .insert({ name: schoolName })
    .select('id')
    .single();

  if (schoolError || !schoolRow) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: schoolError?.message ?? 'school_create_failed' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: userId,
    school_id: schoolRow.id,
    role: 'admin',
    full_name: fullName
  });

  if (profileError) {
    await supabase.from('schools').delete().eq('id', schoolRow.id);
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}
