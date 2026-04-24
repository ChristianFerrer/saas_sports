'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type StudentFormState = { error?: string };

function parseIntOr(raw: string, min?: number, max?: number): number | null {
  const s = raw.trim();
  if (s === '') return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

function parseNumberOr(raw: string, min?: number, max?: number): number | null {
  const s = raw.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

function parseDominantFoot(raw: string): 'left' | 'right' | 'both' | null {
  const s = raw.trim().toLowerCase();
  if (s === 'left' || s === 'right' || s === 'both') return s;
  return null;
}

function parseFormData(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const birthDateRaw = String(formData.get('birth_date') ?? '').trim();
  const groupIdRaw = String(formData.get('group_id') ?? '').trim();
  const enrolledAtRaw = String(formData.get('enrolled_at') ?? '').trim();
  const leftAtRaw = String(formData.get('left_at') ?? '').trim();

  const positionRaw = String(formData.get('position') ?? '').trim();
  const dominantFootRaw = String(formData.get('dominant_foot') ?? '').trim();
  const dorsalRaw = String(formData.get('dorsal_number') ?? '');
  const heightRaw = String(formData.get('height_cm') ?? '');
  const weightRaw = String(formData.get('weight_kg') ?? '');
  const photoUrlRaw = String(formData.get('photo_url') ?? '').trim();

  return {
    fullName,
    birthDate: birthDateRaw === '' ? null : birthDateRaw,
    groupId: groupIdRaw === '' ? null : groupIdRaw,
    enrolledAt: enrolledAtRaw === '' ? null : enrolledAtRaw,
    leftAt: leftAtRaw === '' ? null : leftAtRaw,
    position: positionRaw === '' ? null : positionRaw,
    dominantFoot: parseDominantFoot(dominantFootRaw),
    dorsalNumber: parseIntOr(dorsalRaw, 1, 999),
    heightCm: parseIntOr(heightRaw, 1, 259),
    weightKg: parseNumberOr(weightRaw, 0.1, 299.99),
    photoUrl: photoUrlRaw === '' ? null : photoUrlRaw
  };
}

function validateDateWindow(
  enrolledAt: string | null,
  leftAt: string | null
): 'dateInvalid' | 'dateRangeInvalid' | null {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (enrolledAt && !re.test(enrolledAt)) return 'dateInvalid';
  if (leftAt && !re.test(leftAt)) return 'dateInvalid';
  if (enrolledAt && leftAt && enrolledAt > leftAt) return 'dateRangeInvalid';
  return null;
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const user = await requireRole('admin');
  const parsed = parseFormData(formData);
  const { fullName, birthDate, groupId, enrolledAt, leftAt } = parsed;

  if (!fullName) return { error: 'fullNameRequired' };
  const dateErr = validateDateWindow(enrolledAt, leftAt);
  if (dateErr) return { error: dateErr };

  const supabase = createUntypedClient();
  const { data, error } = await supabase
    .from('students')
    .insert({
      school_id: user.profile.school_id,
      full_name: fullName,
      birth_date: birthDate,
      group_id: groupId,
      enrolled_at: enrolledAt,
      left_at: leftAt,
      position: parsed.position,
      dominant_foot: parsed.dominantFoot,
      dorsal_number: parsed.dorsalNumber,
      height_cm: parsed.heightCm,
      weight_kg: parsed.weightKg,
      photo_url: parsed.photoUrl
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: 'insertFailed' };

  revalidatePath('/admin/students');
  revalidatePath('/admin/groups');
  revalidatePath('/admin');
  redirect(`/admin/students/${data.id}`);
}

export async function updateStudent(
  id: string,
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireRole('admin');
  const parsed = parseFormData(formData);
  const { fullName, birthDate, groupId, enrolledAt, leftAt } = parsed;

  if (!fullName) return { error: 'fullNameRequired' };
  const dateErr = validateDateWindow(enrolledAt, leftAt);
  if (dateErr) return { error: dateErr };

  const supabase = createUntypedClient();
  const { error } = await supabase
    .from('students')
    .update({
      full_name: fullName,
      birth_date: birthDate,
      group_id: groupId,
      enrolled_at: enrolledAt,
      left_at: leftAt,
      position: parsed.position,
      dominant_foot: parsed.dominantFoot,
      dorsal_number: parsed.dorsalNumber,
      height_cm: parsed.heightCm,
      weight_kg: parsed.weightKg,
      photo_url: parsed.photoUrl
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  revalidatePath(`/admin/students/${id}`);
  revalidatePath(`/admin/students/${id}/edit`);
  revalidatePath('/admin/groups');
  redirect(`/admin/students/${id}`);
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
