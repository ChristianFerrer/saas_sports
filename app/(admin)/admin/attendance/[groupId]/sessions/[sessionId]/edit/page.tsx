import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  editSession,
  type SessionFormState
} from '@/app/(admin)/admin/attendance/actions';
import { SessionForm } from '@/components/admin/session-form';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type GroupRow = { id: string; name: string; school_id: string };
type SessionRow = {
  id: string;
  group_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  notes: string | null;
  target_vocabulary: string[] | null;
};

export default async function EditSessionPage({
  params
}: {
  params: { groupId: string; sessionId: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [groupResult, sessionResult] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, school_id')
      .eq('id', params.groupId)
      .maybeSingle(),
    supabase
      .from('class_sessions')
      .select(
        'id, group_id, scheduled_at, duration_minutes, status, notes, target_vocabulary'
      )
      .eq('id', params.sessionId)
      .maybeSingle()
  ]);

  const group = groupResult.data as GroupRow | null;
  const session = sessionResult.data as SessionRow | null;

  if (
    !group ||
    !session ||
    group.school_id !== user.profile.school_id ||
    session.group_id !== group.id
  ) {
    notFound();
  }

  const iso = session.scheduled_at;
  const dateIso = iso.slice(0, 10);
  const timeHHMM = iso.slice(11, 16);

  const boundUpdate = async (
    prev: SessionFormState,
    formData: FormData
  ): Promise<SessionFormState> => {
    'use server';
    return editSession(group.id, session.id, prev, formData);
  };

  return (
    <AppShell
      title={t('admin.attendance.editSession')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
    >
      <div className="mb-4">
        <Link
          href={`/admin/attendance/${group.id}/sessions/${session.id}`}
          className="inline-flex items-center gap-1 text-xs text-ink-300 transition hover:text-ink-100"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {group.name}
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-50">
          {t('admin.attendance.editSession')}
        </h2>
      </div>

      <div className="max-w-lg">
        <SessionForm
          action={boundUpdate}
          cancelHref={`/admin/attendance/${group.id}/sessions/${session.id}`}
          submitLabel={t('common.save')}
          defaults={{
            dateIso,
            timeHHMM,
            durationMinutes: session.duration_minutes,
            status: session.status,
            notes: session.notes,
            targetVocabulary: session.target_vocabulary ?? []
          }}
        />
      </div>
    </AppShell>
  );
}
