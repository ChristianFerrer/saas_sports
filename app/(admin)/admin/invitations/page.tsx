import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';

import { RevokeInvitationButton } from '@/components/admin/revoke-invitation-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type InvitationRow = {
  id: string;
  email: string;
  role: 'admin' | 'coach' | 'parent';
  full_name: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type SearchParams = { error?: string };

export default async function AdminInvitationsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data } = await supabase
    .from('invitations')
    .select('id, email, role, full_name, expires_at, accepted_at, created_at')
    .eq('school_id', user.profile.school_id)
    .order('created_at', { ascending: false });

  const invitations = (data ?? []) as InvitationRow[];
  const now = Date.now();

  const pending = invitations.filter(
    (i) => !i.accepted_at && new Date(i.expires_at).getTime() > now
  );
  const expired = invitations.filter(
    (i) => !i.accepted_at && new Date(i.expires_at).getTime() <= now
  );
  const accepted = invitations.filter((i) => i.accepted_at);

  const errorMessage = searchParams.error;

  return (
    <AppShell
      title={t('admin.invitations.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-50">
          {t('admin.invitations.title')}
        </h2>
        <Link
          href="/admin/invitations/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.invitations.new')}
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-500/15 p-3 text-sm text-red-200"
        >
          {errorMessage}
        </div>
      ) : null}

      {invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white p-6 text-sm text-ink-300">
          {t('admin.invitations.empty')}
        </div>
      ) : (
        <div className="space-y-6">
          <Section title={t('admin.invitations.pending')}>
            {pending.length === 0 ? (
              <EmptyBox>{t('admin.invitations.noPending')}</EmptyBox>
            ) : (
              <InvitationList rows={pending} t={t} format={format} showRevoke />
            )}
          </Section>
          <Section title={t('admin.invitations.accepted')}>
            {accepted.length === 0 ? (
              <EmptyBox>{t('admin.invitations.noAccepted')}</EmptyBox>
            ) : (
              <InvitationList rows={accepted} t={t} format={format} />
            )}
          </Section>
          {expired.length > 0 ? (
            <Section title={t('admin.invitations.expired')}>
              <InvitationList rows={expired} t={t} format={format} showRevoke />
            </Section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white p-4 text-sm text-ink-300">
      {children}
    </div>
  );
}

function InvitationList({
  rows,
  t,
  format,
  showRevoke = false
}: {
  rows: InvitationRow[];
  t: Awaited<ReturnType<typeof getTranslations>>;
  format: Awaited<ReturnType<typeof getFormatter>>;
  showRevoke?: boolean;
}) {
  return (
    <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/10 bg-white">
      {rows.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-50">
              {i.full_name}{' '}
              <span className="text-xs font-normal text-ink-300">
                · {t(`roles.${i.role}`)}
              </span>
            </p>
            <p className="truncate text-xs text-ink-300">{i.email}</p>
            <p className="text-xs text-ink-400">
              {i.accepted_at
                ? t('admin.invitations.acceptedOn', {
                    date: format.dateTime(new Date(i.accepted_at), {
                      dateStyle: 'medium'
                    })
                  })
                : t('admin.invitations.expiresOn', {
                    date: format.dateTime(new Date(i.expires_at), {
                      dateStyle: 'medium'
                    })
                  })}
            </p>
          </div>
          {showRevoke ? (
            <RevokeInvitationButton
              invitationId={i.id}
              confirmMessage={t('admin.invitations.revokeConfirm', { email: i.email })}
              label={t('admin.invitations.revoke')}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
