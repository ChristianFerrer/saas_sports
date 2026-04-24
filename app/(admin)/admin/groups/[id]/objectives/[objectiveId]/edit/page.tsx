import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  updateObjective,
  type ObjectiveFormState
} from '@/app/(admin)/admin/groups/[id]/objectives/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { ObjectiveForm } from '@/components/admin/objective-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type ObjectiveRow = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
};

export default async function EditObjectivePage({
  params
}: {
  params: { id: string; objectiveId: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupResult, objectiveResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, school_id')
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('objectives')
      .select('id, group_id, title, description')
      .eq('id', params.objectiveId)
      .maybeSingle()
  ]);

  const group = groupResult.data as GroupRow | null;
  const objective = objectiveResult.data as ObjectiveRow | null;

  if (
    !group ||
    !objective ||
    group.school_id !== user.profile.school_id ||
    objective.group_id !== group.id
  ) {
    notFound();
  }

  const boundUpdate = async (
    prev: ObjectiveFormState,
    formData: FormData
  ): Promise<ObjectiveFormState> => {
    'use server';
    return updateObjective(group.id, objective.id, prev, formData);
  };

  return (
    <AppShell
      title={t('admin.objectives.edit')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4">
        <Link
          href={`/admin/groups/${group.id}/objectives`}
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {t('admin.objectives.sectionTitle')}
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {t('admin.objectives.edit')}
        </h2>
      </div>

      <div className="max-w-lg">
        <ObjectiveForm
          action={boundUpdate}
          defaults={{
            title: objective.title,
            description: objective.description
          }}
          cancelHref={`/admin/groups/${group.id}/objectives`}
          submitLabel={t('common.save')}
        />
      </div>
    </AppShell>
  );
}
