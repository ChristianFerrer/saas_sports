'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export type SchoolFormState = { error?: string; savedAt?: number };

export async function updateSchool(
  _prev: SchoolFormState,
  formData: FormData
): Promise<SchoolFormState> {
  const user = await requireRole('admin');

  const name = String(formData.get('name') ?? '').trim();
  const contactPhoneRaw = String(formData.get('contact_phone') ?? '').trim();
  const contactEmailRaw = String(formData.get('contact_email') ?? '').trim();
  const commsResponsibleRaw = String(formData.get('comms_responsible') ?? '').trim();

  if (!name) return { error: 'nameRequired' };

  if (contactEmailRaw !== '' && !/.+@.+\..+/.test(contactEmailRaw)) {
    return { error: 'emailInvalid' };
  }

  const supabase = createUntypedClient();

  if (commsResponsibleRaw !== '') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', commsResponsibleRaw)
      .maybeSingle();
    const p = profile as {
      user_id: string;
      school_id: string;
      role: 'admin' | 'coach' | 'parent';
    } | null;
    if (
      !p ||
      p.school_id !== user.profile.school_id ||
      (p.role !== 'admin' && p.role !== 'coach')
    ) {
      return { error: 'commsResponsibleInvalid' };
    }
  }

  const { error } = await supabase
    .from('schools')
    .update({
      name,
      contact_phone: contactPhoneRaw === '' ? null : contactPhoneRaw,
      contact_email: contactEmailRaw === '' ? null : contactEmailRaw,
      comms_responsible: commsResponsibleRaw === '' ? null : commsResponsibleRaw
    })
    .eq('id', user.profile.school_id);

  if (error) {
    console.error('[updateSchool] update failed', error);
    return { error: error.message };
  }

  revalidatePath('/admin/settings');
  return { savedAt: Date.now() };
}
