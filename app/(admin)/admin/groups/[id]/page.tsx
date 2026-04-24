import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  CalendarRange,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Plus,
  Target,
  UserCircle2,
  Users
} from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteGroupButton } from '@/components/admin/delete-group-button';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';
import type { GroupScheduleEntry } from '@/types/database';

type GroupRow = {
  id: string;
  name: string;
  school_id: string;
  coach_id: string | null;
  schedule: GroupScheduleEntry[] | null;
  start_date: string | null;
  end_date: string | null;
};

type CoachRow = { user_id: string; full_name: string };
type StudentRow = { id: string; full_name: string };
type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
};
type AttendanceCountRow = { session_id: string; present: boolean };
type ObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
};
type AchievementCountRow = { objective_id: string };

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

export default async function AdminGroupDetailPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name, school_id, coach_id, schedule, start_date, end_date')
    .eq('id', params.id)
    .maybeSingle();

  const group = groupData as GroupRow | null;
  if (!group || group.school_id !== user.profile.school_id) notFound();

  const [
    coachResult,
    studentsResult,
    sessionsResult,
    attendanceResult,
    objectivesResult
  ] = await Promise.all([
    group.coach_id
      ? supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', group.coach_id)
          .maybeSingle()
      : Promise.resolve({ data: null as CoachRow | null }),
    supabase
      .from('students')
      .select('id, full_name')
      .eq('group_id', group.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('class_sessions')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('group_id', group.id)
      .order('scheduled_at', { ascending: false }),
    supabase.from('attendances').select('session_id, present'),
    supabase
      .from('objectives')
      .select('id, title, description, display_order')
      .eq('group_id', group.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
  ]);

  const coach = coachResult.data as CoachRow | null;
  const students = (studentsResult.data ?? []) as StudentRow[];
  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const attendance = (attendanceResult.data ?? []) as AttendanceCountRow[];
  const objectives = (objectivesResult.data ?? []) as ObjectiveRow[];

  const studentIds = students.map((s) => s.id);
  const objectiveIds = objectives.map((o) => o.id);

  const achievementsByObjective = new Map<string, number>();
  if (objectiveIds.length > 0 && studentIds.length > 0) {
    const { data: achievementsData } = await supabase
      .from('student_objectives')
      .select('objective_id')
      .in('objective_id', objectiveIds)
      .in('student_id', studentIds);
    for (const a of (achievementsData ?? []) as AchievementCountRow[]) {
      achievementsByObjective.set(
        a.objective_id,
        (achievementsByObjective.get(a.objective_id) ?? 0) + 1
      );
    }
  }

  const presentBySession = new Map<string, { present: number; total: number }>();
  for (const a of attendance) {
    const curr = presentBySession.get(a.session_id) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (a.present) curr.present += 1;
    presentBySession.set(a.session_id, curr);
  }

  const now = Date.now();
  const upcoming = sessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() >= now
  );
  const past = sessions.filter((s) => !upcoming.includes(s)).slice(0, 5);

  const schedule = (group.schedule ?? []) as GroupScheduleEntry[];

  return (
    <AppShell
      title={group.name}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4">
        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {t('admin.groups.title')}
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {group.name}
        </h2>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={`/admin/attendance/${group.id}`} className="ss-btn-primary">
          <CheckSquare size={16} strokeWidth={2.4} aria-hidden />
          <span>{t('admin.groups.detail.takeAttendance')}</span>
        </Link>
        <Link href={`/admin/groups/${group.id}/edit`} className="ss-btn-secondary">
          <Pencil size={15} strokeWidth={2.2} aria-hidden />
          <span>{t('admin.groups.detail.editGroup')}</span>
        </Link>
        <DeleteGroupButton
          id={group.id}
          confirmMessage={t('admin.groups.deleteConfirm', { name: group.name })}
          label={t('common.delete')}
        />
      </div>

      <section className="ss-card divide-y divide-slate-100 overflow-hidden">
        <InfoRow
          icon={<UserCircle2 size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.groups.detail.coach')}
        >
          {coach ? (
            <span className="font-medium text-slate-900">{coach.full_name}</span>
          ) : (
            <span className="text-slate-400">
              {t('admin.groups.detail.noCoach')}
            </span>
          )}
        </InfoRow>
        <InfoRow
          icon={<CalendarRange size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.groups.detail.cycle')}
        >
          {group.start_date || group.end_date ? (
            <span className="text-slate-900">
              {group.start_date
                ? format.dateTime(new Date(group.start_date), {
                    dateStyle: 'medium',
                    timeZone: 'UTC'
                  })
                : '—'}
              <span className="mx-1 text-slate-400">→</span>
              {group.end_date
                ? format.dateTime(new Date(group.end_date), {
                    dateStyle: 'medium',
                    timeZone: 'UTC'
                  })
                : '—'}
              <span className="ml-2 text-slate-500">
                · {t('admin.groups.detail.daysPerWeek', { count: schedule.length })}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">
              {t('admin.groups.detail.noCycle')}
            </span>
          )}
        </InfoRow>
        <InfoRow
          icon={<Calendar size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.groups.detail.schedule')}
          alignTop
        >
          {schedule.length === 0 ? (
            <span className="text-slate-400">
              {t('admin.groups.detail.noSchedule')}
            </span>
          ) : (
            <ul className="space-y-0.5">
              {schedule.map((s, idx) => (
                <li key={idx} className="text-slate-900">
                  <span className="font-medium">
                    {t(`admin.groups.schedule.weekdays.${s.weekday}`)}
                  </span>{' '}
                  <span className="text-slate-600">
                    {s.start_time} · {s.duration_minutes}{' '}
                    {t('admin.attendance.minutes')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InfoRow>
      </section>

      <div className="mt-5 mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <Target size={14} strokeWidth={2.4} aria-hidden />
          {t('admin.objectives.sectionTitle')}
        </h3>
        <Link
          href={`/admin/groups/${group.id}/objectives`}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          {t('admin.objectives.manage')}
        </Link>
      </div>
      {objectives.length === 0 ? (
        <EmptyBox>
          <span className="block">{t('admin.objectives.empty')}</span>
          <Link
            href={`/admin/groups/${group.id}/objectives/new`}
            className="ss-btn-primary mt-3"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            {t('admin.objectives.new')}
          </Link>
        </EmptyBox>
      ) : (
        <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
          {objectives.map((o) => {
            const achieved = achievementsByObjective.get(o.id) ?? 0;
            return (
              <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Target size={16} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{o.title}</p>
                  {o.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                      {o.description}
                    </p>
                  ) : null}
                </div>
                {students.length > 0 ? (
                  <span className="ss-pill shrink-0 bg-slate-100 text-slate-600">
                    {t('admin.objectives.achievedRatio', {
                      achieved,
                      total: students.length
                    })}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <SectionHeader
        icon={<Users size={14} strokeWidth={2.4} aria-hidden />}
        label={t('admin.groups.detail.studentsSection', {
          count: students.length
        })}
      />
      {students.length === 0 ? (
        <EmptyBox>{t('admin.groups.detail.noStudents')}</EmptyBox>
      ) : (
        <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/students/${s.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${paletteFor(s.id)}`}
                >
                  {initialsOf(s.full_name) || '·'}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900">
                  {s.full_name}
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-slate-400"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionHeader
        icon={<Calendar size={14} strokeWidth={2.4} aria-hidden />}
        label={t('admin.groups.detail.upcomingSessions')}
      />
      {upcoming.length === 0 ? (
        <EmptyBox>{t('admin.groups.detail.noUpcoming')}</EmptyBox>
      ) : (
        <SessionList
          sessions={upcoming}
          groupId={group.id}
          counts={presentBySession}
          format={format}
          t={t}
        />
      )}

      <SectionHeader
        icon={<CheckSquare size={14} strokeWidth={2.4} aria-hidden />}
        label={t('admin.groups.detail.pastSessions')}
      />
      {past.length === 0 ? (
        <EmptyBox>{t('admin.groups.detail.noPast')}</EmptyBox>
      ) : (
        <SessionList
          sessions={past}
          groupId={group.id}
          counts={presentBySession}
          format={format}
          t={t}
        />
      )}
    </AppShell>
  );
}

function InfoRow({
  icon,
  label,
  alignTop,
  children
}: {
  icon: React.ReactNode;
  label: string;
  alignTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex gap-3 px-4 py-3 ${alignTop ? 'items-start' : 'items-center'}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-slate-700">{children}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
      {icon}
      {label}
    </h3>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function SessionList({
  sessions,
  groupId,
  counts,
  format,
  t
}: {
  sessions: SessionRow[];
  groupId: string;
  counts: Map<string, { present: number; total: number }>;
  format: Awaited<ReturnType<typeof getFormatter>>;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
      {sessions.map((s) => {
        const display = format.dateTime(new Date(s.scheduled_at), {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC'
        });
        const cnt = counts.get(s.id);
        return (
          <li key={s.id}>
            <Link
              href={`/admin/attendance/${groupId}/sessions/${s.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{display}</p>
                <p className="text-xs text-slate-500">
                  {t(`admin.attendance.status.${s.status}`)} · {s.duration_minutes}{' '}
                  {t('admin.attendance.minutes')}
                  {cnt
                    ? ` · ${t('admin.attendance.attendanceRatio', {
                        present: cnt.present,
                        total: cnt.total
                      })}`
                    : ''}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="shrink-0 text-slate-400"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
