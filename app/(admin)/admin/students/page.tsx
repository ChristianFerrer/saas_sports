import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteStudentButton } from '@/components/admin/delete-student-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type SearchParams = { error?: string };

const AVATAR_PALETTE = [
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
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
      nav={<AdminNav />}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t('admin.students.title')}
        </h2>
        <Link href="/admin/students/new" className="ss-btn-primary">
          <Plus size={16} strokeWidth={2.4} aria-hidden />
          <span>{t('admin.students.new')}</span>
        </Link>
      </div>

      {searchParams.error ? (
        <div
          role="alert"
          className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800"
        >
          {searchParams.error}
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t('admin.students.empty')}</p>
          <Link href="/admin/students/new" className="ss-btn-primary mt-3">
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            {t('admin.students.new')}
          </Link>
        </div>
      ) : (
        <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
          {students.map((s) => {
            const groupName = s.group_id ? (groupNameById.get(s.group_id) ?? null) : null;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${paletteFor(s.id)}`}
                >
                  {initialsOf(s.full_name) || '·'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{s.full_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {groupName ?? t('admin.students.unassigned')}
                    {s.birth_date ? ` · ${s.birth_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/students/${s.id}/edit`}
                    aria-label={t('common.edit')}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Pencil size={15} strokeWidth={2.2} aria-hidden />
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </Link>
                  <DeleteStudentButton
                    id={s.id}
                    confirmMessage={t('admin.students.deleteConfirm', {
                      name: s.full_name
                    })}
                    label={t('common.delete')}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
