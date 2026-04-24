import Link from 'next/link';
import { ChevronRight, Layers } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string };
type StudentRow = { group_id: string | null };

export default async function CoachHomePage() {
  const user = await requireRole('coach');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name')
      .eq('coach_id', user.id)
      .order('name', { ascending: true }),
    supabase.from('students').select('group_id')
  ]);

  const groups = (groupsResult.data ?? []) as GroupRow[];
  const studentRows = (studentsResult.data ?? []) as StudentRow[];
  const studentsByGroup = new Map<string, number>();
  for (const s of studentRows) {
    if (s.group_id) {
      studentsByGroup.set(s.group_id, (studentsByGroup.get(s.group_id) ?? 0) + 1);
    }
  }

  return (
    <AppShell
      title={t('coach.home.title')}
      role={t('roles.coach')}
      fullName={user.profile.full_name}
    >
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-100/90">
          {t('coach.home.greetingKicker')}
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
          {t('coach.home.welcome', { name: user.profile.full_name })}
        </h2>
        <p className="mt-1 max-w-md text-sm text-emerald-50/90">
          {t('coach.home.tagline')}
        </p>
      </section>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {t('coach.home.yourGroups')}
      </h3>

      {groups.length === 0 ? (
        <EmptyState message={t('coach.home.empty')} />
      ) : (
        <ul className="mt-2 space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/coach/groups/${g.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-slate-300 hover:shadow-pop"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Layers size={18} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{g.name}</p>
                  <p className="text-xs text-slate-500">
                    {t('admin.groups.studentsCount', {
                      count: studentsByGroup.get(g.id) ?? 0
                    })}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-400 transition group-hover:text-slate-700"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
