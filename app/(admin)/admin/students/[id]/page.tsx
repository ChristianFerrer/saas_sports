import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Cake,
  CalendarCheck2,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Layers,
  LogOut as LogOutIcon,
  Pencil,
  Phone,
  Target,
  Trophy,
  UsersRound,
  XCircle
} from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { DeleteStudentButton } from '@/components/admin/delete-student-button';
import {
  StudentObjectivesList,
  type ObjectiveItem
} from '@/components/admin/student-objectives-list';
import { AppShell } from '@/components/ui/app-shell';
import { PremiumAchievementBadge } from '@/components/ui/premium-achievement-badge';
import { PremiumProfileHero } from '@/components/ui/premium-profile-hero';
import { PremiumProgressRing } from '@/components/ui/premium-progress-ring';
import { PremiumSectionTitle } from '@/components/ui/premium-section-title';
import { PremiumStatCard } from '@/components/ui/premium-stat-card';
import {
  PremiumTimelineRoadmap,
  type RoadmapStep
} from '@/components/ui/premium-timeline-roadmap';
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

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
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

/** Deterministic jersey number 1..99 from the student id. Gives the
 *  player-card "dorsal" feel without adding a schema column. */
function dorsalFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 99) + 1;
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
    achievementsResult,
    schoolGroupsResult
  ] = await Promise.all([
    student.group_id
      ? supabase
          .from('groups')
          .select('id, name, coach_id')
          .eq('id', student.group_id)
          .maybeSingle()
      : Promise.resolve({
          data: null as { id: string; name: string; coach_id: string | null } | null
        }),
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
      .order('achieved_at', { ascending: false }),
    supabase
      .from('groups')
      .select('id, name, created_at')
      .eq('school_id', user.profile.school_id)
      .order('created_at', { ascending: true })
  ]);

  const group = groupResult.data as {
    id: string;
    name: string;
    coach_id: string | null;
  } | null;

  // Coach is a second fetch because it depends on group.coach_id.
  const coach = group?.coach_id
    ? ((
        await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', group.coach_id)
          .maybeSingle()
      ).data as { user_id: string; full_name: string } | null)
    : null;

  const parents = (parentsResult.data ?? []) as unknown as ParentLinkRow[];
  const attendance = (attendanceResult.data ?? []) as AttendanceRow[];
  const allSessions = (sessionsResult.data ?? []) as SessionRow[];
  const currentObjectives = (currentObjectivesResult.data ?? []) as CurrentObjectiveRow[];
  const achievements = (achievementsResult.data ?? []) as unknown as AchievementRow[];
  const schoolGroups = (schoolGroupsResult.data ?? []) as Array<{
    id: string;
    name: string;
    created_at: string;
  }>;

  // Scope sessions to the enrollment window.
  const enrolledMs = student.enrolled_at
    ? new Date(student.enrolled_at + 'T00:00:00Z').getTime()
    : -Infinity;
  const leftMs = student.left_at
    ? new Date(student.left_at + 'T23:59:59Z').getTime()
    : Infinity;
  const sessions = allSessions.filter((s) => {
    const ts = new Date(s.scheduled_at).getTime();
    return ts >= enrolledMs && ts <= leftMs;
  });
  const isInactive = student.left_at !== null;

  // Objectives mapping
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
  const currentAchievedCount = currentObjectiveItems.filter((o) => o.achieved).length;
  const currentObjectivesTotal = currentObjectiveItems.length;

  const historicalAchievements = achievements.filter(
    (a) => a.objectives && a.objectives.group_id !== student.group_id
  );

  // Attendance stats
  const attendanceBySession = new Map<string, AttendanceRow>();
  for (const a of attendance) attendanceBySession.set(a.session_id, a);
  const recordedSessions = sessions.filter((s) => attendanceBySession.has(s.id));
  const totalRecorded = recordedSessions.length;
  const presentCount = recordedSessions.filter(
    (s) => attendanceBySession.get(s.id)?.present
  ).length;
  const attendancePct =
    totalRecorded === 0 ? null : Math.round((presentCount / totalRecorded) * 100);

  // Next session (future, any status)
  const now = Date.now();
  const nextSession = sessions
    .filter((s) => new Date(s.scheduled_at).getTime() >= now)
    .slice()
    .reverse()[0];

  // Roadmap: derive from schoolGroups + student's historical + current
  const pastGroupIds = new Set<string>();
  for (const a of historicalAchievements) {
    if (a.objectives?.group_id) pastGroupIds.add(a.objectives.group_id);
  }
  const currentGroupId = student.group_id ?? null;
  const roadmapSteps: RoadmapStep[] = schoolGroups.map((g) => {
    let state: RoadmapStep['state'];
    if (g.id === currentGroupId) state = 'current';
    else if (pastGroupIds.has(g.id)) state = 'done';
    else state = 'upcoming';
    return { label: g.name, state };
  });
  // Append a final "Futuro" step if we have any steps.
  if (roadmapSteps.length > 0) {
    roadmapSteps.push({
      label: t('admin.students.detail.futureLabel'),
      sub: t('admin.students.detail.futureSub'),
      state: 'dream'
    });
  }

  const age = ageFromBirth(student.birth_date);
  const dorsal = dorsalFor(student.id);

  // Hero meta
  const metaItems: Array<{ label: string; value: React.ReactNode }> = [];
  if (student.birth_date) {
    metaItems.push({
      label: t('admin.students.detail.birthDate'),
      value: (
        <>
          {format.dateTime(new Date(student.birth_date), {
            dateStyle: 'medium',
            timeZone: 'UTC'
          })}
          {age !== null ? (
            <span className="ml-1 font-normal text-ink-300">
              · {age} {t('admin.students.detail.age')}
            </span>
          ) : null}
        </>
      )
    });
  }
  if (group) {
    metaItems.push({
      label: t('admin.students.detail.group'),
      value: (
        <Link
          href={`/admin/groups/${group.id}`}
          className="hover:text-gold-200"
        >
          {group.name}
        </Link>
      )
    });
  }
  if (coach) {
    metaItems.push({
      label: t('admin.groups.detail.coach'),
      value: coach.full_name
    });
  }
  if (student.enrolled_at) {
    metaItems.push({
      label: t('admin.students.detail.enrolledAt'),
      value: format.dateTime(new Date(student.enrolled_at), {
        dateStyle: 'medium',
        timeZone: 'UTC'
      })
    });
  }

  return (
    <AppShell
      title={student.full_name}
      role={t('roles.admin')}
      fullName={user.profile.full_name}
      kicker={group ? group.name : t('admin.students.detail.noGroup')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/students/${student.id}/edit`}
            className="ss-btn-primary"
          >
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
      }
    >
      <Link
        href="/admin/students"
        className="mb-4 inline-flex items-center gap-1 text-xs text-ink-300 transition hover:text-ink-100"
      >
        <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
        {t('admin.students.title')}
      </Link>

      <PremiumProfileHero
        kicker={isInactive ? t('admin.students.detail.inactive') : t('admin.students.detail.hero.kicker')}
        title={student.full_name}
        subtitle={
          group
            ? t('admin.students.detail.hero.subtitle', { group: group.name })
            : undefined
        }
        initials={initialsOf(student.full_name)}
        dorsal={dorsal}
        meta={metaItems}
        rightSlot={
          <PremiumProgressRing
            value={attendancePct}
            size={148}
            strokeWidth={14}
            variant="cyan"
            sublabel={t('admin.students.detail.attendance')}
          />
        }
      />

      {/* KPI row */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PremiumStatCard
          kicker={t('admin.students.detail.kpis.attendance')}
          icon={<CheckSquare size={18} strokeWidth={2.2} aria-hidden />}
          accent="cyan"
          value={attendancePct === null ? '—' : `${attendancePct}%`}
          sub={
            totalRecorded === 0
              ? t('admin.students.detail.noAttendance')
              : t('admin.students.detail.attendanceSummary', {
                  present: presentCount,
                  total: totalRecorded
                })
          }
        />
        <PremiumStatCard
          kicker={t('admin.students.detail.kpis.objectives')}
          icon={<Target size={18} strokeWidth={2.2} aria-hidden />}
          accent="gold"
          value={
            currentObjectivesTotal === 0
              ? '—'
              : `${currentAchievedCount}/${currentObjectivesTotal}`
          }
          sub={
            currentObjectivesTotal === 0
              ? t('admin.students.detail.objectivesEmpty')
              : t('admin.students.detail.kpis.objectivesSub')
          }
        />
        <PremiumStatCard
          kicker={t('admin.students.detail.kpis.nextSession')}
          icon={<CalendarCheck2 size={18} strokeWidth={2.2} aria-hidden />}
          accent="emerald"
          value={
            nextSession
              ? format.dateTime(new Date(nextSession.scheduled_at), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'UTC'
                })
              : '—'
          }
          sub={
            nextSession
              ? t(`admin.attendance.status.${nextSession.status}`)
              : t('admin.students.detail.kpis.noNext')
          }
        />
      </div>

      {/* Camino formativo */}
      {roadmapSteps.length > 0 ? (
        <>
          <PremiumSectionTitle
            kicker={t('admin.students.detail.roadmap.kicker')}
            title={t('admin.students.detail.roadmap.title')}
          />
          <PremiumTimelineRoadmap
            steps={roadmapSteps}
            caption={t('admin.students.detail.roadmap.caption')}
          />
        </>
      ) : null}

      {/* Objetivos del grupo actual */}
      <PremiumSectionTitle
        icon={<Target size={14} strokeWidth={2.4} aria-hidden />}
        kicker={t('admin.students.detail.objectives.kicker')}
        title={
          group
            ? t('admin.students.detail.objectivesCurrent', { group: group.name })
            : t('admin.students.detail.objectivesNoGroup')
        }
        action={
          group ? (
            <Link
              href={`/admin/groups/${group.id}/objectives`}
              className="text-xs font-semibold text-gold-300 hover:text-gold-200"
            >
              {t('admin.objectives.manage')}
            </Link>
          ) : null
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

      {/* Logros anteriores */}
      {historicalAchievements.length > 0 ? (
        <>
          <PremiumSectionTitle
            icon={<Trophy size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('admin.students.detail.achievements.kicker')}
            title={t('admin.students.detail.objectivesHistorical')}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {historicalAchievements.slice(0, 12).map((a) => {
              const obj = a.objectives!;
              return (
                <PremiumAchievementBadge
                  key={`${obj.id}-${a.achieved_at}`}
                  title={obj.title}
                  sub={format.dateTime(new Date(a.achieved_at), {
                    dateStyle: 'medium'
                  })}
                  tone="gold"
                />
              );
            })}
          </div>
        </>
      ) : null}

      {/* Datos básicos */}
      <PremiumSectionTitle
        icon={<UsersRound size={14} strokeWidth={2.4} aria-hidden />}
        kicker={t('admin.students.detail.contactInfo.kicker')}
        title={t('admin.students.detail.contactInfo.title')}
      />
      <section className="ss-card divide-y divide-white/[0.05] overflow-hidden">
        <InfoRow
          icon={<Cake size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.birthDate')}
        >
          {student.birth_date ? (
            <>
              {format.dateTime(new Date(student.birth_date), {
                dateStyle: 'long',
                timeZone: 'UTC'
              })}
              {age !== null ? (
                <span className="ml-2 text-ink-300">
                  ({age} {t('admin.students.detail.age')})
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-ink-400">
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
              className="font-medium text-gold-300 hover:text-gold-200"
            >
              {group.name}
            </Link>
          ) : (
            <span className="text-ink-400">
              {t('admin.students.detail.noGroup')}
            </span>
          )}
        </InfoRow>

        <InfoRow
          icon={<CalendarCheck2 size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.enrolledAt')}
        >
          {student.enrolled_at ? (
            format.dateTime(new Date(student.enrolled_at), {
              dateStyle: 'long',
              timeZone: 'UTC'
            })
          ) : (
            <span className="text-ink-400">
              {t('admin.students.detail.noEnrolledAt')}
            </span>
          )}
        </InfoRow>

        {student.left_at ? (
          <InfoRow
            icon={<LogOutIcon size={18} strokeWidth={2.2} aria-hidden />}
            label={t('admin.students.detail.leftAt')}
          >
            {format.dateTime(new Date(student.left_at), {
              dateStyle: 'long',
              timeZone: 'UTC'
            })}
          </InfoRow>
        ) : null}

        <InfoRow
          icon={<UsersRound size={18} strokeWidth={2.2} aria-hidden />}
          label={t('admin.students.detail.parents')}
          alignTop
        >
          {parents.length === 0 ? (
            <span className="text-ink-400">
              {t('admin.students.detail.noParents')}
            </span>
          ) : (
            <ul className="space-y-1">
              {parents.map((p) => (
                <li key={p.parent_user_id} className="text-ink-100">
                  <span className="font-semibold text-ink-50">
                    {p.profiles?.full_name ?? '—'}
                  </span>
                  {p.profiles?.phone ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-ink-300">
                      <Phone size={12} strokeWidth={2} aria-hidden />
                      {p.profiles.phone}
                    </span>
                  ) : null}
                  {p.relationship ? (
                    <span className="ml-2 text-ink-400">
                      · {p.relationship}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </InfoRow>
      </section>

      {/* Recent sessions */}
      {sessions.length > 0 ? (
        <>
          <PremiumSectionTitle
            icon={<CheckSquare size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('admin.students.detail.recent.kicker')}
            title={t('admin.students.detail.recentSessions')}
          />
          <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
            {sessions.slice(0, 8).map((s) => {
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
                  <span
                    aria-hidden
                    className={
                      !att
                        ? 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-ink-300'
                        : att.present
                          ? 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300'
                          : 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-500/20 text-red-300'
                    }
                  >
                    {!att ? (
                      <ChevronRight size={14} strokeWidth={2.4} />
                    ) : att.present ? (
                      <CheckCircle2 size={16} strokeWidth={2.4} />
                    ) : (
                      <XCircle size={16} strokeWidth={2.4} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-50">{display}</p>
                    <p className="text-xs text-ink-300">
                      {t(`admin.attendance.status.${s.status}`)} ·{' '}
                      {s.duration_minutes} {t('admin.attendance.minutes')}
                    </p>
                    {att?.coach_notes ? (
                      <p className="mt-1 text-sm text-ink-200">{att.coach_notes}</p>
                    ) : null}
                  </div>
                  <span
                    className={
                      !att
                        ? 'ss-pill-mute shrink-0'
                        : att.present
                          ? 'ss-pill-success shrink-0'
                          : 'ss-pill-danger shrink-0'
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
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-ink-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-ink-100">{children}</div>
      </div>
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-sm text-ink-300">
      {children}
    </div>
  );
}
