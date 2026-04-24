import Link from 'next/link';
import { ChevronRight, Layers } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { PremiumSectionTitle } from '@/components/ui/premium-section-title';
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
      kicker={t('coach.home.greetingKicker')}
    >
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-navy-800/60 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-70"
        />
        <div className="relative z-10 max-w-xl">
          <p className="ss-kicker text-gold-300">
            {t('coach.home.greetingKicker')}
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-4xl">
            <span className="text-gradient-gold">{user.profile.full_name}</span>
          </h2>
          <p className="mt-2 text-sm text-ink-200 sm:text-base">
            {t('coach.home.tagline')}
          </p>
        </div>
      </section>

      <PremiumSectionTitle
        kicker={t('coach.home.yourGroups')}
        title={t('coach.home.yourGroups')}
      />

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-ink-300">
          {t('coach.home.empty')}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/coach/groups/${g.id}`}
                className="group ss-card flex items-center gap-3 p-4 transition hover:border-white/15 hover:shadow-pop"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 text-gold-300 ring-1 ring-gold-400/20">
                  <Layers size={18} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-50">{g.name}</p>
                  <p className="text-xs text-ink-300">
                    {t('admin.groups.studentsCount', {
                      count: studentsByGroup.get(g.id) ?? 0
                    })}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-ink-400 transition group-hover:text-ink-100"
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
