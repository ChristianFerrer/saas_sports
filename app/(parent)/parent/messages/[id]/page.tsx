import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { ParentNav } from '@/components/ui/parent-nav';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type CommunicationRow = {
  id: string;
  subject: string;
  content: string;
  sent_at: string | null;
  created_at: string;
};

type RecipientRow = {
  communication_id: string;
  read_at: string | null;
};

export default async function ParentMessageDetailPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: recipient } = await supabase
    .from('communication_recipients')
    .select('communication_id, read_at')
    .eq('parent_user_id', user.id)
    .eq('communication_id', params.id)
    .maybeSingle();

  const r = recipient as RecipientRow | null;
  if (!r) notFound();

  const { data: communication } = await supabase
    .from('communications')
    .select('id, subject, content, sent_at, created_at')
    .eq('id', params.id)
    .maybeSingle();

  const c = communication as CommunicationRow | null;
  if (!c) notFound();

  if (!r.read_at) {
    await supabase
      .from('communication_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('parent_user_id', user.id)
      .eq('communication_id', params.id);
  }

  const date = format.dateTime(new Date(c.sent_at ?? c.created_at), {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return (
    <AppShell
      title={c.subject}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
      nav={<ParentNav />}
    >
      <div className="mb-4">
        <Link
          href="/parent/messages"
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← {t('parent.messages.title')}
        </Link>
        <h2 className="text-xl font-semibold text-slate-900">{c.subject}</h2>
        <p className="mt-1 text-xs text-slate-500">{date}</p>
      </div>

      <article className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-slate-800">
        {c.content}
      </article>
    </AppShell>
  );
}
