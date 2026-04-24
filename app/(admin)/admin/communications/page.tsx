import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';

import { DeleteCommunicationButton } from '@/components/admin/delete-communication-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type CommRow = {
  id: string;
  subject: string;
  group_id: string | null;
  sent_at: string | null;
  created_at: string;
};

type GroupRow = { id: string; name: string };
type RecipientCountRow = { communication_id: string; read_at: string | null };

export default async function AdminCommunicationsPage() {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const [commsResult, groupsResult, recipientsResult] = await Promise.all([
    supabase
      .from('communications')
      .select('id, subject, group_id, sent_at, created_at')
      .eq('school_id', user.profile.school_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('groups')
      .select('id, name')
      .eq('school_id', user.profile.school_id),
    supabase.from('communication_recipients').select('communication_id, read_at')
  ]);

  const comms = (commsResult.data ?? []) as CommRow[];
  const groups = new Map<string, string>();
  for (const g of (groupsResult.data ?? []) as GroupRow[]) groups.set(g.id, g.name);

  const stats = new Map<string, { total: number; read: number }>();
  for (const r of (recipientsResult.data ?? []) as RecipientCountRow[]) {
    const curr = stats.get(r.communication_id) ?? { total: 0, read: 0 };
    curr.total += 1;
    if (r.read_at) curr.read += 1;
    stats.set(r.communication_id, curr);
  }

  return (
    <AppShell
      title={t('admin.communications.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-50">
          {t('admin.communications.title')}
        </h2>
        <Link
          href="/admin/communications/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {t('admin.communications.new')}
        </Link>
      </div>

      {comms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white p-6 text-sm text-ink-300">
          {t('admin.communications.empty')}
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/10 bg-white">
          {comms.map((c) => {
            const s = stats.get(c.id) ?? { total: 0, read: 0 };
            const groupName = c.group_id ? groups.get(c.group_id) : null;
            return (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-50">{c.subject}</p>
                  <p className="text-xs text-ink-300">
                    {groupName
                      ? t('admin.communications.audienceGroup', { group: groupName })
                      : t('admin.communications.audienceSchool')}{' '}
                    ·{' '}
                    {t('admin.communications.sentOn', {
                      date: format.dateTime(new Date(c.sent_at ?? c.created_at), {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    })}
                  </p>
                  <p className="text-xs text-ink-300">
                    {t('admin.communications.readStats', {
                      read: s.read,
                      total: s.total
                    })}
                  </p>
                </div>
                <DeleteCommunicationButton
                  communicationId={c.id}
                  confirmMessage={t('admin.communications.deleteConfirm', {
                    subject: c.subject
                  })}
                  label={t('common.delete')}
                />
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
