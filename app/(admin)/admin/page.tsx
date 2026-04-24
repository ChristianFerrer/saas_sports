import Link from 'next/link';
import {
  ArrowUpRight,
  CheckSquare,
  Layers,
  Mail,
  UserPlus,
  Users
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

export default async function AdminHomePage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupsResult, studentsResult] = await Promise.all([
    supabase.from('groups').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true })
  ]);

  const groupsCount = groupsResult.count ?? 0;
  const studentsCount = studentsResult.count ?? 0;

  return (
    <AppShell
      title={t('admin.home.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-100/90">
          {t('admin.home.greetingKicker')}
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
          {t('admin.home.welcome', { name: user.profile.full_name })}
        </h2>
        <p className="mt-1 max-w-md text-sm text-emerald-50/90">
          {t('admin.home.tagline')}
        </p>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard
          href="/admin/groups"
          icon={<Layers size={18} strokeWidth={2.2} />}
          label={t('admin.home.stats.groups')}
          value={groupsCount}
          accent="emerald"
        />
        <StatCard
          href="/admin/students"
          icon={<Users size={18} strokeWidth={2.2} />}
          label={t('admin.home.stats.students')}
          value={studentsCount}
          accent="indigo"
        />
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {t('admin.home.quickActions')}
      </h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <ActionCard
          href="/admin/groups/new"
          icon={<Layers size={18} strokeWidth={2.2} />}
          label={t('admin.home.actions.newGroup')}
          hint={t('admin.home.actions.newGroupHint')}
        />
        <ActionCard
          href="/admin/students/new"
          icon={<Users size={18} strokeWidth={2.2} />}
          label={t('admin.home.actions.newStudent')}
          hint={t('admin.home.actions.newStudentHint')}
        />
        <ActionCard
          href="/admin/attendance"
          icon={<CheckSquare size={18} strokeWidth={2.2} />}
          label={t('admin.home.actions.takeAttendance')}
          hint={t('admin.home.actions.takeAttendanceHint')}
        />
        <ActionCard
          href="/admin/invitations/new"
          icon={<UserPlus size={18} strokeWidth={2.2} />}
          label={t('admin.home.actions.invite')}
          hint={t('admin.home.actions.inviteHint')}
        />
        <ActionCard
          href="/admin/communications/new"
          icon={<Mail size={18} strokeWidth={2.2} />}
          label={t('admin.home.actions.message')}
          hint={t('admin.home.actions.messageHint')}
        />
      </div>
    </AppShell>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  accent
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'emerald' | 'indigo';
}) {
  const iconBg = accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700';
  return (
    <Link
      href={href}
      className="group ss-card flex items-center justify-between gap-3 p-4 transition hover:border-slate-300 hover:shadow-pop sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>{icon}</span>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
      </div>
      <ArrowUpRight
        size={18}
        className="text-slate-400 transition group-hover:text-slate-700"
        aria-hidden
      />
    </Link>
  );
}

function ActionCard({
  href,
  icon,
  label,
  hint
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group ss-card flex items-start gap-3 p-4 transition hover:border-slate-300 hover:shadow-pop"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      <ArrowUpRight
        size={16}
        className="shrink-0 text-slate-400 transition group-hover:text-slate-700"
        aria-hidden
      />
    </Link>
  );
}
