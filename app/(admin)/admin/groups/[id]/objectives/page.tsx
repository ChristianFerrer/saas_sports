import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Pencil, Plus, Target } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteObjectiveButton } from '@/components/admin/delete-objective-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type ObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
};

type SearchParams = { error?: string };

export default async function GroupObjectivesPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: SearchParams;
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

  const { data: objectivesData } = await supabase
    .from('objectives')
    .select('id, title, description, display_order, created_at')
    .eq('group_id', group.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  const objectives = (objectivesData ?? []) as ObjectiveRow[];

  return (
    <AppShell
      title={t('admin.objectives.title', { group: group.name })}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4">
        <Link
          href={`/admin/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {group.name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t('admin.objectives.sectionTitle')}
          </h2>
          <Link
            href={`/admin/groups/${group.id}/objectives/new`}
            className="ss-btn-primary"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            <span>{t('admin.objectives.new')}</span>
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {t('admin.objectives.sectionHint')}
        </p>
      </div>

      {searchParams.error ? (
        <div
          role="alert"
          className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800"
        >
          {searchParams.error}
        </div>
      ) : null}

      {objectives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t('admin.objectives.empty')}</p>
          <Link
            href={`/admin/groups/${group.id}/objectives/new`}
            className="ss-btn-primary mt-3"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            {t('admin.objectives.new')}
          </Link>
        </div>
      ) : (
        <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
          {objectives.map((o) => (
            <li
              key={o.id}
              className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Target size={18} strokeWidth={2.2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{o.title}</p>
                {o.description ? (
                  <p className="mt-0.5 text-sm text-slate-600">{o.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/groups/${group.id}/objectives/${o.id}/edit`}
                  aria-label={t('common.edit')}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Pencil size={15} strokeWidth={2.2} aria-hidden />
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </Link>
                <DeleteObjectiveButton
                  groupId={group.id}
                  objectiveId={o.id}
                  confirmMessage={t('admin.objectives.deleteConfirm', {
                    title: o.title
                  })}
                  label={t('common.delete')}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
