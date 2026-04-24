import Link from 'next/link';
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
      <p className="text-slate-700">
        {t('coach.home.welcome', { name: user.profile.full_name })}
      </p>

      {groups.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t('coach.home.empty')}
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/coach/groups/${g.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-400 hover:shadow-sm"
              >
                <p className="font-medium text-slate-900">{g.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('admin.groups.studentsCount', {
                    count: studentsByGroup.get(g.id) ?? 0
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
