import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { updateGroup, type GroupFormState } from '@/app/(admin)/admin/groups/actions';
import { GroupForm } from '@/components/admin/group-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';
import type { GroupScheduleEntry } from '@/types/database';

type GroupRow = {
  id: string;
  name: string;
  schedule: GroupScheduleEntry[] | null;
  coach_id: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
};

type CoachRow = { user_id: string; full_name: string };

export default async function EditGroupPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [{ data: groupData }, { data: coachesData }] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, schedule, coach_id, start_date, end_date, display_order')
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('school_id', user.profile.school_id)
      .eq('role', 'coach')
      .order('full_name', { ascending: true })
  ]);

  const group = groupData as GroupRow | null;
  if (!group) notFound();
  const coaches = (coachesData ?? []) as CoachRow[];

  const boundUpdate = async (
    prev: GroupFormState,
    formData: FormData
  ): Promise<GroupFormState> => {
    'use server';
    return updateGroup(params.id, prev, formData);
  };

  return (
    <AppShell
      title={t('admin.groups.edit')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold text-ink-50">
          {t('admin.groups.edit')}
        </h2>
        <GroupForm
          action={boundUpdate}
          defaultName={group.name}
          defaultSchedule={Array.isArray(group.schedule) ? group.schedule : []}
          defaultCoachId={group.coach_id}
          defaultStartDate={group.start_date}
          defaultEndDate={group.end_date}
          defaultDisplayOrder={group.display_order ?? 0}
          coaches={coaches.map((c) => ({ id: c.user_id, fullName: c.full_name }))}
          showSchedule
          showCoach
          showCycle
          showOrder
          submitLabel={t('common.save')}
        />
      </div>
    </AppShell>
  );
}
