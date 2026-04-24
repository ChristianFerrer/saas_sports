import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type RecipientRow = {
  communication_id: string;
  read_at: string | null;
  communications: {
    id: string;
    subject: string;
    sent_at: string | null;
    created_at: string;
  } | null;
};

export default async function ParentMessagesPage() {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data } = await supabase
    .from('communication_recipients')
    .select(
      'communication_id, read_at, communications (id, subject, sent_at, created_at)'
    )
    .eq('parent_user_id', user.id);

  const rows = ((data ?? []) as unknown as RecipientRow[])
    .filter((r) => r.communications !== null)
    .sort((a, b) => {
      const aT = new Date(a.communications!.sent_at ?? a.communications!.created_at).getTime();
      const bT = new Date(b.communications!.sent_at ?? b.communications!.created_at).getTime();
      return bT - aT;
    });

  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <AppShell
      title={t('parent.messages.title')}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-50">
          {t('parent.messages.title')}
        </h2>
        {unread > 0 ? (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-gold-300">
            {t('parent.messages.unreadCount', { count: unread })}
          </span>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white p-6 text-sm text-ink-300">
          {t('parent.messages.empty')}
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/10 bg-white">
          {rows.map((r) => {
            const c = r.communications!;
            const date = format.dateTime(new Date(c.sent_at ?? c.created_at), {
              dateStyle: 'medium',
              timeStyle: 'short'
            });
            return (
              <li key={c.id}>
                <Link
                  href={`/parent/messages/${c.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        r.read_at
                          ? 'truncate text-ink-100'
                          : 'truncate font-semibold text-ink-50'
                      }
                    >
                      {c.subject}
                    </p>
                    <p className="text-xs text-ink-300">{date}</p>
                  </div>
                  {!r.read_at ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/15" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
