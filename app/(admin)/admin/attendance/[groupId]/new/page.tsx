import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { createSession } from '@/app/(admin)/admin/attendance/actions';
import { SessionForm } from '@/components/admin/session-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };

export default async function NewSessionPage({
  params
}: {
  params: { groupId: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, school_id')
    .eq('id', params.groupId)
    .maybeSingle();

  const g = group as GroupRow | null;
  if (!g || g.school_id !== user.profile.school_id) notFound();

  const action = createSession.bind(null, g.id);

  return (
    <AppShell
      title={t('admin.attendance.newSession')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4">
        <Link
          href={`/admin/attendance/${g.id}`}
          className="text-xs text-ink-300 hover:text-ink-100"
        >
          ← {g.name}
        </Link>
        <h2 className="text-xl font-semibold text-ink-50">
          {t('admin.attendance.newSessionFor', { name: g.name })}
        </h2>
      </div>

      <div className="max-w-lg">
        <SessionForm
          action={action}
          cancelHref={`/admin/attendance/${g.id}`}
          submitLabel={t('common.create')}
        />
      </div>
    </AppShell>
  );
}
