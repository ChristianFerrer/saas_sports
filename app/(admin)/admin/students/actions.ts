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

export async function toggleStudentObjective(
  studentId: string,
  objectiveId: string,
  achieved: boolean
): Promise<void> {
  const user = await requireRole('admin');
  const supabase = createUntypedClient();

  if (achieved) {
    const { error } = await supabase.from('student_objectives').upsert(
      {
        student_id: studentId,
        objective_id: objectiveId,
        achieved_at: new Date().toISOString(),
        marked_by: user.id
      },
      { onConflict: 'student_id,objective_id' }
    );
    if (error) {
      console.error('[toggleStudentObjective] upsert failed', {
        studentId,
        objectiveId,
        error
      });
    }
  } else {
    const { error } = await supabase
      .from('student_objectives')
      .delete()
      .eq('student_id', studentId)
      .eq('objective_id', objectiveId);
    if (error) {
      console.error('[toggleStudentObjective] delete failed', {
        studentId,
        objectiveId,
        error
      });
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/groups`);
}
