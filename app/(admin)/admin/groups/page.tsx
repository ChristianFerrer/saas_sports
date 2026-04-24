import Link from 'next/link';
import { ChevronRight, Layers, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SearchParams = { error?: string };

export default async function AdminGroupsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name')
      .eq('school_id', user.profile.school_id)
      .order('name', { ascending: true }),
    supabase.from('students').select('group_id')
  ]);

  const groups = (groupsResult.data ?? []) as Array<{ id: string; name: string }>;
  const studentRows = (studentsResult.data ?? []) as Array<{ group_id: string | null }>;
  const countByGroup = new Map<string, number>();
  for (const s of studentRows) {
    if (s.group_id) {
      countByGroup.set(s.group_id, (countByGroup.get(s.group_id) ?? 0) + 1);
    }
  }

  const errorMessage =
    searchParams.error === 'hasStudents'
      ? t('admin.groups.errors.hasStudents')
      : searchParams.error;

  return (
    <AppShell
      title={t('admin.groups.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      actions={
        <Link href="/admin/groups/new" className="ss-btn-primary">
          <Plus size={16} strokeWidth={2.4} aria-hidden />
          <span>{t('admin.groups.new')}</span>
        </Link>
      }
    >
      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-ink-300">{t('admin.groups.empty')}</p>
          <Link href="/admin/groups/new" className="ss-btn-primary mt-4">
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            {t('admin.groups.new')}
          </Link>
        </div>
      ) : (
        <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
          {groups.map((g) => {
            const count = countByGroup.get(g.id) ?? 0;
            return (
              <li key={g.id}>
                <Link
                  href={`/admin/groups/${g.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 text-gold-300 ring-1 ring-gold-400/20">
                    <Layers size={18} strokeWidth={2.2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-50">{g.name}</p>
                    <p className="text-xs text-ink-300">
                      {t('admin.groups.studentsCount', { count })}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-ink-400"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
