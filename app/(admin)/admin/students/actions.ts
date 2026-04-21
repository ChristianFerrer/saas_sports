'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type StudentFormState = { error?: string };

function parseFormData(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const birthDateRaw = String(formData.get('birth_date') ?? '').trim();
  const groupIdRaw = String(formData.get('group_id') ?? '').trim();
  return {
    fullName,
    birthDate: birthDateRaw === '' ? null : birthDateRaw,
    groupId: groupIdRaw === '' ? null : groupIdRaw
  };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const user = await requireRole('admin');
  const { fullName, birthDate, groupId } = parseFormData(formData);

  if (!fullName) return { error: 'fullNameRequired' };

  const supabase = createUntypedClient();
  const { error } = await supabase.from('students').insert({
    school_id: user.profile.school_id,
    full_name: fullName,
    birth_date: birthDate,
    group_id: groupId
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  revalidatePath('/admin/groups');
  revalidatePath('/admin');
  redirect('/admin/students');
}

export async function updateStudent(
  id: string,
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireRole('admin');
  const { fullName, birthDate, groupId } = parseFormData(formData);

  if (!fullName) return { error: 'fullNameRequired' };

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('students')
    .update({ full_name: fullName, birth_date: birthDate, group_id: groupId })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  revalidatePath(`/admin/students/${id}/edit`);
  revalidatePath('/admin/groups');
  redirect('/admin/students');
}

export async function deleteStudent(id: string): Promise<void> {
  await requireRole('admin');

  const supabase = createUntypedClient();
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) redirect(`/admin/students?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/admin/students');
  revalidatePath('/admin/groups');
  revalidatePath('/admin');
  redirect('/admin/students');
}
