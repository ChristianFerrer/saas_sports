import {
  CheckSquare,
  Layers,
  Mail,
  UserPlus,
  Users
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { PremiumSectionTitle } from '@/components/ui/premium-section-title';
import { PremiumStatCard } from '@/components/ui/premium-stat-card';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function AdminHomePage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', user.profile.school_id),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', user.profile.school_id)
  ]);

  const groupsCount = groupsResult.count ?? 0;
  const studentsCount = studentsResult.count ?? 0;

  return (
    <AppShell
      title={t('admin.home.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      kicker={t('admin.home.greetingKicker')}
    >
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-navy-800/60 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-70"
        />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="ss-kicker text-gold-300">
              {t('admin.home.greetingKicker')}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-4xl">
              <span className="text-gradient-gold">{user.profile.full_name}</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-200 sm:text-base">
              {t('admin.home.tagline')}
            </p>
          </div>
          <div className="flex items-baseline gap-6 text-ink-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                {t('admin.home.stats.groups')}
              </p>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ink-50">
                {groupsCount}
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                {t('admin.home.stats.students')}
              </p>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ink-50">
                {studentsCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PremiumStatCard
          href="/admin/groups"
          kicker={t('admin.home.stats.groups')}
          value={groupsCount}
          accent="gold"
          icon={<Layers size={18} strokeWidth={2.2} aria-hidden />}
        />
        <PremiumStatCard
          href="/admin/students"
          kicker={t('admin.home.stats.students')}
          value={studentsCount}
          accent="cyan"
          icon={<Users size={18} strokeWidth={2.2} aria-hidden />}
        />
      </div>

      <PremiumSectionTitle
        kicker={t('admin.home.quickActions')}
        title={t('admin.home.quickActions')}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <PremiumStatCard
          href="/admin/groups/new"
          icon={<Layers size={18} strokeWidth={2.2} aria-hidden />}
          kicker={t('admin.home.actions.newGroup')}
          accent="gold"
          value={
            <span className="text-[17px] font-semibold">
              {t('admin.home.actions.newGroup')}
            </span>
          }
          sub={t('admin.home.actions.newGroupHint')}
        />
        <PremiumStatCard
          href="/admin/students/new"
          icon={<Users size={18} strokeWidth={2.2} aria-hidden />}
          kicker={t('admin.home.actions.newStudent')}
          accent="cyan"
          value={
            <span className="text-[17px] font-semibold">
              {t('admin.home.actions.newStudent')}
            </span>
          }
          sub={t('admin.home.actions.newStudentHint')}
        />
        <PremiumStatCard
          href="/admin/attendance"
          icon={<CheckSquare size={18} strokeWidth={2.2} aria-hidden />}
          kicker={t('admin.home.actions.takeAttendance')}
          accent="emerald"
          value={
            <span className="text-[17px] font-semibold">
              {t('admin.home.actions.takeAttendance')}
            </span>
          }
          sub={t('admin.home.actions.takeAttendanceHint')}
        />
        <PremiumStatCard
          href="/admin/invitations/new"
          icon={<UserPlus size={18} strokeWidth={2.2} aria-hidden />}
          kicker={t('admin.home.actions.invite')}
          accent="mute"
          value={
            <span className="text-[17px] font-semibold">
              {t('admin.home.actions.invite')}
            </span>
          }
          sub={t('admin.home.actions.inviteHint')}
        />
        <PremiumStatCard
          href="/admin/communications/new"
          icon={<Mail size={18} strokeWidth={2.2} aria-hidden />}
          kicker={t('admin.home.actions.message')}
          accent="mute"
          value={
            <span className="text-[17px] font-semibold">
              {t('admin.home.actions.message')}
            </span>
          }
          sub={t('admin.home.actions.messageHint')}
        />
      </div>
    </AppShell>
  );
}
