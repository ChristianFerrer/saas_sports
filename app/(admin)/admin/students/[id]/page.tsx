import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Cake,
  CalendarCheck2,
  CheckSquare,
  ChevronLeft,
  Layers,
  LogOut as LogOutIcon,
  Pencil,
  Target,
  UsersRound
} from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { DeleteStudentButton } from '@/components/admin/delete-student-button';
import {
  StudentObjectivesList,
  type ObjectiveItem
} from '@/components/admin/student-objectives-list';
import { AppShell } from '@/components/ui/app-shell';
import { requireRole } from '@/lib/auth/guards';
import { createUntypedClient } from '@/lib/supabase/server';

type StudentRow = {
  id: string;
  school_id: string;
  group_id: string | null;
  full_name: string;
  birth_date: string | null;
  enrolled_at: string | null;
  left_at: string | null;
};

type GroupRow = { id: string; name: string };

type ParentLinkRow = {
  parent_user_id: string;
  relationship: string | null;
  profiles: { user_id: string; full_name: string; phone: string | null } | null;
};

type AttendanceRow = {
  session_id: string;
  present: boolean;
  coach_notes: string | null;
};

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
};

type CurrentObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
};

type AchievementRow = {
  objective_id: string;
  achieved_at: string;
  objectives: {
    id: string;
    title: string;
    description: string | null;
    group_id: string;
  } | null;
};

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

function ageFromBirth(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

export default async function AdminStudentDetailPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireRole('admin');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: studentData } = await supabase
    .from('students')
    .select(
      'id, school_id, group_id, full_name, birth_date, enrolled_at, left_at'
    )
    .eq('id', params.id)
    .maybeSingle();

  const student = studentData as StudentRow | null;
  if (!student || student.school_id !== user.profile.school_id) notFound();

  const [
    groupResult,
    parentsResult,
    attendanceResult,
    sessionsResult,
    currentObjectivesResult,
    achievementsResult
  ] = await Promise.all([
    student.group_id
      ? supabase
          .from('groups')
          .select('id, name')
          .eq('id', student.group_id)
          .maybeSingle()
      : Promise.resolve({ data: null as GroupRow | null }),
    supabase
      .from('student_parents')
      .select(
        'parent_user_id, relationship, profiles (user_id, full_name, phone)'
      )
      .eq('student_id', student.id),
    supabase
      .from('attendances')
      .select('session_id, present, coach_notes')
      .eq('student_id', student.id),
    student.group_id
      ? supabase
          .from('class_sessions')
          .select('id, scheduled_at, duration_minutes, status')
          .eq('group_id', student.group_id)
          .order('scheduled_at', { ascending: false })
      : Promise.resolve({ data: [] as SessionRow[] }),
    student.group_id
      ? supabase
          .from('objectives')
          .select('id, title, description, display_order')
          .eq('group_id', student.group_id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as CurrentObjectiveRow[] }),
    supabase
      .from('student_objectives')
      .select(
        'objective_id, achieved_at, objectives (id, title, description, group_id)'
      )
      .eq('student_id', student.id)
      .order('achieved_at', { ascending: false })
  ]);

  const group = groupResult.data as GroupRow | null;
  const parents = (parentsResult.data ?? []) as unknown as ParentLinkRow[];
  const attendance = (attendanceResult.data ?? []) as AttendanceRow[];
  const allSessions = (sessionsResult.data ?? []) as SessionRow[];
  const currentObjectives = (currentObjectivesResult.data ?? []) as CurrentObjectiveRow[];
  const achievements = (achievementsResult.data ?? []) as unknown as AchievementRow[];

  // Scope sessions to the enrollment window: before enrolled_at and after
  // left_at shouldn't count toward this student's attendance stats.
  const enrolledMs = student.enrolled_at
    ? new Date(student.enrolled_at + 'T00:00:00Z').getTime()
    : -Infinity;
  const leftMs = student.left_at
    ? new Date(student.left_at + 'T23:59:59Z').getTime()
    : Infinity;
  const sessions = allSessions.filter((s) => {
    const t = new Date(s.scheduled_at).getTime();
    return t >= enrolledMs && t <= leftMs;
  });
  const isInactive = student.left_at !== null;

  const achievementByObjectiveId = new Map<string, AchievementRow>();
  for (const a of achievements) achievementByObjectiveId.set(a.objective_id, a);

  const currentObjectiveItems: ObjectiveItem[] = currentObjectives.map((o) => {
    const ach = achievementByObjectiveId.get(o.id);
    return {
      id: o.id,
      title: o.title,
      description: o.description,
      achieved: Boolean(ach),
      achievedAt: ach?.achieved_at ?? null
    };
  });

  const historicalAchievements = achievements.filter(
    (a) => a.objectives && a.objectives.group_id !== student.group_id
  );

  const historicalGroupIds = Array.from(
    new Set(historicalAchievements.map((a) => a.objectives?.group_id).filter((g): g is string => !!g))
  );
  const historicalGroupsById = new Map<string, string>();
  if (historicalGroupIds.length > 0) {
    const { data: historicalGroups } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', historicalGroupIds);
    for (const g of (historicalGroups ?? []) as GroupRow[]) {
      historicalGroupsById.set(g.id, g.name);
    }
  }

  const attendanceBySession = new Map<string, AttendanceRow>();
  for (const a of attendance) attendanceBySession.set(a.session_id, a);

  const recordedSessions = sessions.filter((s) => attendanceBySession.has(s.id));
  const totalRecorded = recordedSessions.length;
  const presentCount = recordedSessions.filter(
    (s) => attendanceBySession.get(s.id)?.present
  ).length;
  const pct =
    totalRecorded === 0 ? null : Math.round((presentCount / totalRecorded) * 100);

  const recentSessions = sessions.slice(0, 10);
  const age = ageFromBirth(student.birth_date);

  return (
    <AppShell
      title={student.full_name}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      nav={<AdminNav />}
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
        >
          <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          {t('admin.students.title')}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold ${paletteFor(student.id)}`}
          >
            {initialsOf(student.full_name) || '·'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {student.full_name}
            </h2>
            {isInactive ? (
              <span className="ss-pill mt-1 bg-slate-100 text-slate-600">
                {t('admin.students.detail.inactive')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={`/admin/students/${student.id}/edit`} className="ss-btn-primary">
          <Pencil size={15} strokeWidth={2.2} aria-hidden />
          <span>{t('admin.students.detail.editStudent')}</span>
        </Link>
        <DeleteStudentButton
          id={student.id}
          confirmMessage={t('admin.students.deleteConfirm', {
            name: student.full_name
          })}
          label={t('common.delete')}
        />
      </div>

      <section className="ss-card divide-y divide-slate-100 overflow-hidden">
        <InfoRow
          icon={<Cake size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.birthDate')}
        >
          {student.birth_date ? (
            <span className="text-slate-900">
              {format.dateTime(new Date(student.birth_date), {
                dateStyle: 'long',
                timeZone: 'UTC'
              })}
              {age !== null ? (
                <span className="ml-2 text-slate-500">
                  ({age} {t('admin.students.detail.age')})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-slate-400">
              {t('admin.students.detail.noBirthDate')}
            </span>
          )}
        </InfoRow>

        <InfoRow
          icon={<Layers size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.group')}
        >
          {group ? (
            <Link
              href={`/admin/groups/${group.id}`}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              {group.name}
            </Link>
          ) : (
            <span className="text-slate-400">
              {t('admin.students.detail.noGroup')}
            </span>
          )}
        </InfoRow>

        <InfoRow
          icon={<CalendarCheck2 size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.enrolledAt')}
        >
          {student.enrolled_at ? (
            <span className="text-slate-900">
              {format.dateTime(new Date(student.enrolled_at), {
                dateStyle: 'long',
                timeZone: 'UTC'
              })}
            </span>
          ) : (
            <span className="text-slate-400">
              {t('admin.students.detail.noEnrolledAt')}
            </span>
          )}
        </InfoRow>

        {student.left_at ? (
          <InfoRow
            icon={<LogOutIcon size={18} strokeWidth={2.2} aria-hidden />}
            label={t('admin.students.detail.leftAt')}
          >
            <span className="text-slate-900">
              {format.dateTime(new Date(student.left_at), {
                dateStyle: 'long',
                timeZone: 'UTC'
              })}
            </span>
          </InfoRow>
        ) : null}

        <InfoRow
          icon={<UsersRound size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.parents')}
          alignTop
        >
          {parents.length === 0 ? (
            <span className="text-slate-400">
              {t('admin.students.detail.noParents')}
            </span>
          ) : (
            <ul className="space-y-0.5">
              {parents.map((p) => (
                <li key={p.parent_user_id} className="text-slate-900">
                  <span className="font-medium">
                    {p.profiles?.full_name ?? '—'}
                  </span>
                  {p.profiles?.phone ? (
                    <span className="ml-2 text-slate-500">
                      · {p.profiles.phone}
                    </span>
                  ) : null}
                  {p.relationship ? (
                    <span className="ml-2 text-slate-400">
                      · {p.relationship}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </InfoRow>
      </section>

      <SectionHeader
        icon={<Target size={14} strokeWidth={2.4} aria-hidden />}
        label={
          group
            ? t('admin.students.detail.objectivesCurrent', { group: group.name })
            : t('admin.students.detail.objectivesNoGroup')
        }
      />
      {!group ? (
        <EmptyBox>{t('admin.students.detail.objectivesNoGroupHint')}</EmptyBox>
      ) : currentObjectiveItems.length === 0 ? (
        <EmptyBox>{t('admin.students.detail.objectivesEmpty')}</EmptyBox>
      ) : (
        <StudentObjectivesList
          studentId={student.id}
          objectives={currentObjectiveItems}
          toggleHint={t('admin.students.detail.toggleHint')}
        />
      )}

      {historicalAchievements.length > 0 ? (
        <>
          <SectionHeader
            icon={<Target size={14} strokeWidth={2.4} aria-hidden />}
            label={t('admin.students.detail.objectivesHistorical')}
          />
          <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
            {historicalAchievements.map((a) => {
              const obj = a.objectives!;
              const groupName = historicalGroupsById.get(obj.group_id) ?? '—';
              return (
                <li
                  key={`${obj.id}-${a.achieved_at}`}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                    <CheckSquare size={15} strokeWidth={2.6} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {obj.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {groupName} ·{' '}
                      {format.dateTime(new Date(a.achieved_at), {
                        dateStyle: 'medium'
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      <SectionHeader
        icon={<CheckSquare size={14} strokeWidth={2.4} aria-hidden />}
        label={t('admin.students.detail.attendance')}
      />
      {pct === null ? (
        <EmptyBox>{t('admin.students.detail.noAttendance')}</EmptyBox>
      ) : (
        <div className="ss-card p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {pct}%
            </p>
            <p className="text-xs text-slate-500">
              {t('admin.students.detail.attendanceSummary', {
                present: presentCount,
                total: totalRecorded
              })}
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={
                pct >= 80
                  ? 'h-full bg-emerald-500'
                  : pct >= 50
                    ? 'h-full bg-amber-500'
                    : 'h-full bg-red-500'
              }
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {recentSessions.length > 0 ? (
        <>
          <SectionHeader
            icon={<CheckSquare size={14} strokeWidth={2.4} aria-hidden />}
            label={t('admin.students.detail.recentSessions')}
          />
          <ul className="ss-card divide-y divide-slate-100 overflow-hidden">
            {recentSessions.map((s) => {
              const att = attendanceBySession.get(s.id);
              const display = format.dateTime(new Date(s.scheduled_at), {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC'
              });
              return (
                <li
                  key={s.id}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {display}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t(`admin.attendance.status.${s.status}`)} ·{' '}
                      {s.duration_minutes} {t('admin.attendance.minutes')}
                    </p>
                    {att?.coach_notes ? (
                      <p className="mt-1 text-sm text-slate-700">
                        {att.coach_notes}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={
                      !att
                        ? 'ss-pill bg-slate-100 text-slate-600'
                        : att.present
                          ? 'ss-pill bg-emerald-50 text-emerald-700'
                          : 'ss-pill bg-red-50 text-red-700'
                    }
                  >
                    {!att
                      ? t('parent.attendance.pending')
                      : att.present
                        ? t('parent.attendance.present')
                        : t('parent.attendance.absent')}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
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
