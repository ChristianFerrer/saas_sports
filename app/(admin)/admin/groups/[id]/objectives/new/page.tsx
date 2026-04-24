import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { createObjective } from '@/app/(admin)/admin/groups/[id]/objectives/actions';
import { ObjectiveForm } from '@/components/admin/objective-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };

export default async function NewObjectivePage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name, school_id')
    .eq('id', params.id)
    .maybeSingle();

  const group = groupData as GroupRow | null;
  if (!group || group.school_id !== user.profile.school_id) notFound();

  const action = createObjective.bind(null, group.id);

  return (
    <AppShell
      title={t('admin.objectives.new')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4">
        <Link
          href={`/admin/groups/${group.id}/objectives`}
          className="inline-flex items-center gap-1 text-xs text-ink-300 transition hover:text-ink-100"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {t('admin.objectives.sectionTitle')}
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-50">
          {t('admin.objectives.new')}
        </h2>
        <p className="mt-1 text-sm text-ink-200">
          {t('admin.objectives.newHint', { group: group.name })}
        </p>
      </div>

      <div className="max-w-lg">
        <ObjectiveForm
          action={action}
          cancelHref={`/admin/groups/${group.id}/objectives`}
          submitLabel={t('common.create')}
        />
      </div>
    </AppShell>
  );
}
