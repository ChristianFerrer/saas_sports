'use server';

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/profile';
import { createUntypedServiceClient } from '@/lib/supabase/service';

export type CompleteSignupState = { error?: string };

export async function completeSignup(
  _prev: CompleteSignupState,
  formData: FormData
): Promise<CompleteSignupState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.profile) {
    redirect('/');
  }

  const schoolName = String(formData.get('school_name') ?? '').trim();
  const fullName =
    String(formData.get('full_name') ?? '').trim() ||
    user.email?.split('@')[0] ||
    'Admin';

  if (!schoolName) return { error: 'required_field' };

  const supabase = createUntypedServiceClient();

  const { data: schoolRow, error: schoolError } = await supabase
    .from('schools')
    .insert({ name: schoolName })
    .select('id')
    .single();

  if (schoolError || !schoolRow) {
    return { error: schoolError?.message ?? 'school_create_failed' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: user.id,
    school_id: schoolRow.id,
    role: 'admin',
    full_name: fullName
  });

  if (profileError) {
    await supabase.from('schools').delete().eq('id', schoolRow.id);
    return { error: profileError.message };
  }

  redirect('/admin');
}
