import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SearchParams = { error?: string };

// Deterministic tonal palette for initials avatars (gold / cyan / emerald
// glass tints — reads well on the dark shell).
const AVATAR_PALETTE = [
  'bg-gold-500/20 text-gold-200 ring-1 ring-gold-400/20',
  'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/20',
  'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/20',
  'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/20',
  'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/20'
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

export default async function AdminStudentsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const supabase = createUntypedClient();

  const [studentsResult, groupsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, birth_date, group_id')
      .eq('school_id', user.profile.school_id)
      .order('full_name', { ascending: true }),
    supabase.from('groups').select('id, name')
  ]);

  const students = (studentsResult.data ?? []) as Array<{
    id: string;
    full_name: string;
    birth_date: string | null;
    group_id: string | null;
  }>;
  const groupRows = (groupsResult.data ?? []) as Array<{ id: string; name: string }>;
  const groupNameById = new Map<string, string>();
  for (const g of groupRows) groupNameById.set(g.id, g.name);

  return (
    <AppShell
      title={t('admin.students.title')}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      actions={
        <Link href="/admin/students/new" className="ss-btn-primary">
          <Plus size={16} strokeWidth={2.4} aria-hidden />
          <span>{t('admin.students.new')}</span>
        </Link>
      }
    >
      {searchParams.error ? (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {searchParams.error}
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-ink-300">{t('admin.students.empty')}</p>
          <Link href="/admin/students/new" className="ss-btn-primary mt-4">
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            {t('admin.students.new')}
          </Link>
        </div>
      ) : (
        <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
          {students.map((s) => {
            const groupName = s.group_id ? (groupNameById.get(s.group_id) ?? null) : null;
            return (
              <li key={s.id}>
                <Link
                  href={`/admin/students/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${paletteFor(s.id)}`}
                  >
                    {initialsOf(s.full_name) || '·'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-50">{s.full_name}</p>
                    <p className="truncate text-xs text-ink-300">
                      {groupName ?? t('admin.students.unassigned')}
                      {s.birth_date ? ` · ${s.birth_date}` : ''}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-ink-400"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
