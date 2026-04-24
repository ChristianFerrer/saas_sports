import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, Phone, Plus, UserCog } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SchoolForm } from '@/components/admin/school-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SchoolRow = {
  id: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  comms_responsible: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'coach' | 'parent';
};

const AVATAR_PALETTE = [
  'bg-emerald-500/20 text-gold-300',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-300',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700'
];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function paletteFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1)
    hash = (hash + id.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[hash];
}

export default async function AdminSettingsPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [schoolResult, profilesResult] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, contact_phone, contact_email, comms_responsible')
      .eq('id', user.profile.school_id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('user_id, full_name, phone, role')
      .eq('school_id', user.profile.school_id)
      .in('role', ['admin', 'coach'])
      .order('full_name', { ascending: true })
  ]);

  const school = schoolResult.data as SchoolRow | null;
  if (!school) notFound();

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const coaches = profiles.filter((p) => p.role === 'coach');

  return (
    <AppShell
      title={t('admin.settings.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-50">
          {t('admin.settings.title')}
        </h2>
        <p className="mt-1 text-sm text-ink-200">{t('admin.settings.subtitle')}</p>
      </div>

      <section className="ss-card p-5 sm:p-6">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-ink-50">
            {t('admin.settings.schoolSection')}
          </h3>
          <p className="mt-0.5 text-xs text-ink-300">
            {t('admin.settings.schoolSectionHint')}
          </p>
        </header>
        <SchoolForm
          defaults={{
            name: school.name,
            contactPhone: school.contact_phone,
            contactEmail: school.contact_email,
            commsResponsible: school.comms_responsible
          }}
          profiles={profiles.map((p) => ({
            userId: p.user_id,
            fullName: p.full_name,
            role: p.role === 'admin' ? 'admin' : 'coach'
          }))}
        />
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-300">
            <UserCog size={14} strokeWidth={2.4} aria-hidden />
            {t('admin.settings.coachesSection', { count: coaches.length })}
          </h3>
          <Link
            href="/admin/invitations/new"
            className="text-xs font-medium text-gold-300 hover:text-gold-200"
          >
            {t('admin.settings.inviteCoach')}
          </Link>
        </div>

        {coaches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white p-6 text-center">
            <p className="text-sm text-ink-300">
              {t('admin.settings.noCoaches')}
            </p>
            <Link
              href="/admin/invitations/new"
              className="ss-btn-primary mt-3"
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden />
              {t('admin.settings.inviteCoach')}
            </Link>
          </div>
        ) : (
          <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
            {coaches.map((c) => (
              <li
                key={c.user_id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${paletteFor(c.user_id)}`}
                >
                  {initialsOf(c.full_name) || '·'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-50">
                    {c.full_name}
                  </p>
                  {c.phone ? (
                    <p className="flex items-center gap-1 truncate text-xs text-ink-300">
                      <Phone size={12} strokeWidth={2} aria-hidden />
                      {c.phone}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {school.contact_phone || school.contact_email ? (
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-300">
            <Mail size={14} strokeWidth={2.4} aria-hidden />
            {t('admin.settings.publicContact')}
          </h3>
          <div className="ss-card p-4">
            <p className="text-sm text-ink-100">
              {school.contact_phone ? (
                <span className="inline-flex items-center gap-1.5 mr-4">
                  <Phone size={14} strokeWidth={2.2} className="text-ink-300" aria-hidden />
                  {school.contact_phone}
                </span>
              ) : null}
              {school.contact_email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} strokeWidth={2.2} className="text-ink-300" aria-hidden />
                  {school.contact_email}
                </span>
              ) : null}
            </p>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
