import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Cake,
  CalendarCheck2,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Frown,
  Layers,
  LogOut as LogOutIcon,
  Meh,
  Pencil,
  Phone,
  Smile,
  Sparkles,
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
import { StudentSkillsEditor } from '@/components/admin/student-skills-editor';
import { AppShell } from '@/components/ui/app-shell';
import { PremiumAchievementBadge } from '@/components/ui/premium-achievement-badge';
import { PremiumLineChart } from '@/components/ui/premium-line-chart';
import { PremiumPlayerCard } from '@/components/ui/premium-player-card';
import { PremiumProgressPanel } from '@/components/ui/premium-progress-panel';
import { PremiumSectionTitle } from '@/components/ui/premium-section-title';
import { PremiumStatCard } from '@/components/ui/premium-stat-card';
import {
  PremiumTimelineRoadmap,
  type RoadmapStep
} from '@/components/ui/premium-timeline-roadmap';
import { SoftSkillsPanel } from '@/components/ui/soft-skills-panel';
import { VocabularyPanel } from '@/components/ui/vocabulary-panel';
import { requireRole } from '@/lib/auth/guards';
import { ageYearsMonths } from '@/lib/students/age';
import { buildMonthlyAttendanceSeries } from '@/lib/students/attendance-series';
import { LK_LEVELS, lkLevelFromAge, lkLevelOrder } from '@/lib/students/lk-levels';
import { buildMonthlySkillSeries } from '@/lib/students/skill-series';
import {
  SKILL_KEYS,
  SOFT_SKILL_KEYS,
  type SkillKey,
  type SoftSkillKey
} from '@/lib/students/skills';
import { createUntypedClient } from '@/lib/supabase/server';
import type { LkLevel } from '@/types/database';

type StudentRow = {
  id: string;
  school_id: string;
  group_id: string | null;
  full_name: string;
  birth_date: string | null;
  enrolled_at: string | null;
  left_at: string | null;
  dorsal_number: number | null;
  position: string | null;
  dominant_foot: 'left' | 'right' | 'both' | null;
  height_cm: number | null;
  weight_kg: number | null;
  photo_url: string | null;
  english_vocab_known: string[] | null;
  english_vocab_used: string[] | null;
};

type ParentLinkRow = {
  parent_user_id: string;
  relationship: string | null;
  profiles: { user_id: string; full_name: string; phone: string | null } | null;
};

type AttendanceRow = {
  session_id: string;
  present: boolean;
  coach_notes: string | null;
  mood: number | null;
};

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  target_vocabulary: string[] | null;
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

function dominantFootLabel(
  t: Awaited<ReturnType<typeof getTranslations>>,
  v: 'left' | 'right' | 'both' | null
): string | null {
  if (v === 'left') return t('admin.students.fields.dominantFootLeft');
  if (v === 'right') return t('admin.students.fields.dominantFootRight');
  if (v === 'both') return t('admin.students.fields.dominantFootBoth');
  return null;
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
      'id, school_id, group_id, full_name, birth_date, enrolled_at, left_at, ' +
        'dorsal_number, position, dominant_foot, height_cm, weight_kg, photo_url, ' +
        'english_vocab_known, english_vocab_used'
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
    schoolGroupsResult,
    skillsResult,
    snapshotsResult
  ] = await Promise.all([
    student.group_id
      ? supabase
          .from('groups')
          .select('id, name, coach_id, lk_level, start_date, end_date')
          .eq('id', student.group_id)
          .maybeSingle()
      : Promise.resolve({
          data: null as {
            id: string;
            name: string;
            coach_id: string | null;
            lk_level: LkLevel | null;
            start_date: string | null;
            end_date: string | null;
          } | null
        }),
    supabase
      .from('student_parents')
      .select(
        'parent_user_id, relationship, profiles (user_id, full_name, phone)'
      )
      .eq('student_id', student.id),
    supabase
      .from('attendances')
      .select('session_id, present, coach_notes, mood')
      .eq('student_id', student.id),
    student.group_id
      ? supabase
          .from('class_sessions')
          .select('id, scheduled_at, duration_minutes, status, target_vocabulary')
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
      .select('id, name, created_at, display_order, lk_level')
      .eq('school_id', user.profile.school_id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('student_skills')
      .select('skill, value')
      .eq('student_id', student.id),
    supabase
      .from('student_skill_snapshots')
      .select('captured_month, value')
      .eq('student_id', student.id)
      .order('captured_month', { ascending: true })
  ]);

  const group = groupResult.data as {
    id: string;
    name: string;
    coach_id: string | null;
    lk_level: LkLevel | null;
    start_date: string | null;
    end_date: string | null;
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
    display_order: number;
    lk_level: LkLevel | null;
  }>;
  const skillRows = (skillsResult.data ?? []) as Array<{
    skill: string;
    value: number;
  }>;
  const skillsByKey = new Map<string, number>();
  for (const s of skillRows) skillsByKey.set(s.skill, s.value);
  const snapshots = (snapshotsResult.data ?? []) as Array<{
    captured_month: string;
    value: number;
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

  // LK roadmap (fixed 4 programmes + Graduación). Current level comes from
  // the student's group lk_level; if null, we fall back to age. Past levels
  // are inferred from previously completed groups that had a lk_level.
  const pastGroupIds = new Set<string>();
  for (const a of historicalAchievements) {
    if (a.objectives?.group_id) pastGroupIds.add(a.objectives.group_id);
  }
  const pastLevels = new Set<LkLevel>();
  for (const g of schoolGroups) {
    if (g.lk_level && pastGroupIds.has(g.id)) pastLevels.add(g.lk_level);
  }
  const currentLkLevel: LkLevel | null =
    group?.lk_level ?? lkLevelFromAge(student.birth_date);
  const currentOrder = currentLkLevel ? lkLevelOrder(currentLkLevel) : -1;
  const roadmapSteps: RoadmapStep[] = LK_LEVELS.map((lvl) => {
    let state: RoadmapStep['state'];
    if (currentLkLevel && lvl.key === currentLkLevel) state = 'current';
    else if (pastLevels.has(lvl.key)) state = 'done';
    else if (currentOrder >= 0 && lkLevelOrder(lvl.key) < currentOrder)
      state = 'done';
    else state = 'upcoming';
    return {
      label: t(`admin.students.detail.lkLevel.${lvl.key}` as const),
      sub: t(`admin.students.detail.lkLevelAge.${lvl.key}` as const),
      state
    };
  });
  roadmapSteps.push({
    label: t('admin.students.detail.lkLevel.graduation'),
    sub: t('admin.students.detail.futureSub'),
    state: 'dream'
  });
  const completedTermsCount = pastLevels.size;

  const footLabel = dominantFootLabel(t, student.dominant_foot);
  const ageYM = ageYearsMonths(student.birth_date);

  // Trimester window from group cycle dates → "Oct – Dic" pill on the
  // big block. The label localises both ends if present.
  const termRange =
    group?.start_date && group?.end_date
      ? format.dateTime(new Date(group.start_date), {
          month: 'short',
          timeZone: 'UTC'
        }) +
        ' – ' +
        format.dateTime(new Date(group.end_date), {
          month: 'short',
          timeZone: 'UTC'
        })
      : null;
  const termTag = termRange ?? '—';

  // Hero meta lines: "Programa LK · Grupo" → "DOB (X años Y meses)" → "Coach: …"
  const playerMetaLines: string[] = [];
  const lkLevelLabel = currentLkLevel
    ? t(`admin.students.detail.lkLevel.${currentLkLevel}` as const)
    : null;
  if (lkLevelLabel || group) {
    playerMetaLines.push([lkLevelLabel, group?.name].filter(Boolean).join(' · '));
  }
  if (student.birth_date) {
    const dob = format.dateTime(new Date(student.birth_date), {
      dateStyle: 'long',
      timeZone: 'UTC'
    });
    if (ageYM) {
      const parts: string[] = [];
      if (ageYM.years > 0)
        parts.push(
          ageYM.years === 1
            ? t('admin.students.detail.ageYearOne')
            : t('admin.students.detail.ageYearOther', { count: ageYM.years })
        );
      if (ageYM.months > 0)
        parts.push(
          ageYM.months === 1
            ? t('admin.students.detail.ageMonthOne')
            : t('admin.students.detail.ageMonthOther', { count: ageYM.months })
        );
      const ageStr = parts.length > 0 ? ` (${parts.join(' ')})` : '';
      playerMetaLines.push(`${dob}${ageStr}`);
    } else {
      playerMetaLines.push(dob);
    }
  }

  // Stats grid: First class + Trimestres completados always, plus
  // height / weight / foot when populated.
  const playerStats: Array<{ label: string; value: React.ReactNode }> = [];
  if (student.enrolled_at) {
    playerStats.push({
      label: t('admin.students.detail.firstClass'),
      value: format.dateTime(new Date(student.enrolled_at), {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })
    });
  }
  playerStats.push({
    label: t('admin.students.detail.completedTerms'),
    value: String(completedTermsCount)
  });
  if (student.height_cm) {
    playerStats.push({
      label: t('admin.students.detail.height'),
      value: `${student.height_cm} cm`
    });
  }
  if (student.weight_kg) {
    playerStats.push({
      label: t('admin.students.detail.weight'),
      value: `${student.weight_kg} kg`
    });
  }
  if (footLabel) {
    playerStats.push({
      label: t('admin.students.detail.dominantFoot'),
      value: footLabel
    });
  }

  // Mi progreso — 5 LK skills + monthly perception line. The big ring
  // shows the % of badge sub-skills unlocked this term, not the skill
  // average (that's the LK methodology).
  const skillItems = SKILL_KEYS.map((k: SkillKey) => ({
    key: k,
    label: t(`parent.detail.skills.${k}` as const),
    value: skillsByKey.get(k) ?? 0
  }));
  const softSkillItems = SOFT_SKILL_KEYS.map((k: SoftSkillKey) => ({
    key: k,
    label: t(`admin.students.detail.softSkillsValues.${k}` as const),
    value: skillsByKey.get(k) ?? 0
  }));
  const badgePct =
    currentObjectivesTotal === 0
      ? null
      : Math.round((currentAchievedCount / currentObjectivesTotal) * 100);
  const skillSeries = buildMonthlySkillSeries(snapshots, 10);
  const encouragingLine =
    badgePct !== null && badgePct >= 70
      ? t('admin.students.detail.progress.encouragingHigh')
      : badgePct !== null && badgePct >= 50
        ? t('admin.students.detail.progress.encouragingMid')
        : badgePct !== null
          ? t('admin.students.detail.progress.encouragingLow')
          : null;

  // Mood average (0..2) across recorded attendances within the
  // enrollment window. Drives the new disfrute KPI.
  const moodValues: number[] = [];
  for (const a of attendance) {
    if (a.mood === 0 || a.mood === 1 || a.mood === 2) moodValues.push(a.mood);
  }
  const moodAvg =
    moodValues.length === 0
      ? null
      : moodValues.reduce((s, v) => s + v, 0) / moodValues.length;
  const moodLabel =
    moodAvg === null
      ? '—'
      : moodAvg >= 1.5
        ? t('admin.students.detail.mood.averageHigh')
        : moodAvg >= 0.8
          ? t('admin.students.detail.mood.averageMid')
          : t('admin.students.detail.mood.averageLow');
  const moodIcon =
    moodAvg === null ? Meh : moodAvg >= 1.5 ? Smile : moodAvg >= 0.8 ? Meh : Frown;
  const MoodIcon = moodIcon;

  // Vocabulary aggregates (union of session targets) and the latest
  // session's words → "this week".
  const termWords = Array.from(
    new Set(
      sessions.flatMap((ss) =>
        Array.isArray(ss.target_vocabulary) ? ss.target_vocabulary : []
      )
    )
  );
  const lastSessionWithWords = sessions.find(
    (ss) => Array.isArray(ss.target_vocabulary) && ss.target_vocabulary.length > 0
  );
  const weekWords = lastSessionWithWords?.target_vocabulary ?? [];
  const knownWords = student.english_vocab_known ?? [];
  const usedWords = student.english_vocab_used ?? [];

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

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <PremiumPlayerCard
          fullName={student.full_name}
          initials={initialsOf(student.full_name)}
          photoUrl={student.photo_url}
          meta={playerMetaLines}
          dorsal={termTag}
          dorsalLabel={t('admin.students.detail.dorsalLabel')}
          stats={playerStats}
        />
        <PremiumProgressPanel
          title={t('admin.students.detail.progress.title')}
          seasonLabel={t('admin.students.detail.progress.term', {
            label: termRange ?? t('admin.students.detail.termNoDates')
          })}
          globalScore={badgePct}
          globalLabel={t('admin.students.detail.progress.global')}
          skills={skillItems}
          series={skillSeries}
          encouragingLine={encouragingLine}
          emptyHint={t('admin.students.detail.progress.emptySeries')}
        />
      </div>

      {isInactive ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-300">
          {t('admin.students.detail.inactive')}
        </p>
      ) : null}

      {/* Monthly attendance trend */}
      {(() => {
        const series = buildMonthlyAttendanceSeries(
          sessions.map((s) => ({ id: s.id, scheduled_at: s.scheduled_at })),
          attendance.map((a) => ({ session_id: a.session_id, present: a.present })),
          10
        );
        const hasAny = series.some((p) => p.value !== null);
        if (!hasAny) return null;
        return (
          <section className="ss-card mt-5 p-4 sm:p-5">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="ss-kicker text-gold-300">
                  {t('admin.students.detail.trend.kicker')}
                </p>
                <h3 className="mt-0.5 text-[15px] font-bold text-ink-50">
                  {t('admin.students.detail.trend.title')}
                </h3>
              </div>
              <span className="ss-pill-mute">
                {t('admin.students.detail.trend.lastMonths', { count: 10 })}
              </span>
            </div>
            <PremiumLineChart data={series} height={180} variant="cyan" />
          </section>
        );
      })()}

      {/* KPI row — Disfrute medio · Sub-skills del badge · Próxima sesión */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PremiumStatCard
          kicker={t('parent.detail.kpis.mood')}
          icon={<MoodIcon size={18} strokeWidth={2.2} aria-hidden />}
          accent="cyan"
          value={moodLabel}
          sub={
            attendancePct === null
              ? t('admin.students.detail.noAttendance')
              : t('admin.students.detail.attendanceSummary', {
                  present: presentCount,
                  total: totalRecorded
                })
          }
        />
        <PremiumStatCard
          kicker={t('parent.detail.kpis.objectives')}
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
              : t('parent.detail.kpis.objectivesSub')
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

      {/* English vocabulary tracker */}
      <PremiumSectionTitle
        kicker={t('admin.students.detail.vocabulary.kicker')}
        title={t('admin.students.detail.vocabulary.title')}
      />
      <VocabularyPanel
        kicker={t('admin.students.detail.vocabulary.kicker')}
        title={t('admin.students.detail.vocabulary.title')}
        termWords={termWords}
        knownWords={knownWords}
        usedWords={usedWords}
        weekWords={weekWords}
        weekLabel={t('admin.students.detail.vocabulary.wordsThisWeek')}
        trackerLabel={
          termWords.length === 0
            ? t('admin.students.detail.vocabulary.trackerEmpty')
            : t('admin.students.detail.vocabulary.tracker', {
                known: knownWords.length,
                total: termWords.length
              })
        }
        knownLegend={t('admin.students.detail.vocabulary.knownLabel')}
        usedLegend={t('admin.students.detail.vocabulary.usedLabel')}
        emptyHint={t('admin.students.detail.vocabulary.noTarget')}
      />

      {/* Soft skills (Independencia / Confianza social / Sigue al coach) */}
      <PremiumSectionTitle
        kicker={t('admin.students.detail.softSkills.kicker')}
        title={t('admin.students.detail.softSkills.title')}
      />
      <SoftSkillsPanel
        kicker={t('admin.students.detail.softSkills.kicker')}
        title={t('admin.students.detail.softSkills.title')}
        hint={t('admin.students.detail.softSkills.hint')}
        items={softSkillItems}
      />

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

      {/* Habilidades (per-skill) */}
      <PremiumSectionTitle
        icon={<Sparkles size={14} strokeWidth={2.4} aria-hidden />}
        kicker={t('admin.students.detail.skills.kicker')}
        title={t('admin.students.detail.skills.title')}
      />
      <section className="ss-card p-4 sm:p-5">
        <StudentSkillsEditor
          studentId={student.id}
          entries={SKILL_KEYS.map((k: SkillKey) => ({
            key: k,
            label: t(`parent.detail.skills.${k}` as const),
            value: skillsByKey.get(k) ?? 0
          }))}
          softEntries={SOFT_SKILL_KEYS.map((k: SoftSkillKey) => ({
            key: k,
            label: t(`admin.students.detail.softSkillsValues.${k}` as const),
            value: skillsByKey.get(k) ?? 0
          }))}
          softTitle={t('admin.students.detail.softSkills.title')}
          saveLabel={t('common.save')}
          savedLabel={t('admin.attendance.saved')}
        />
        <p className="mt-4 text-xs text-ink-400">
          {t('admin.students.detail.skills.hint')}
        </p>
      </section>

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
              {ageYM ? (
                <span className="ml-2 text-ink-300">
                  ({ageYM.years > 0
                    ? ageYM.years === 1
                      ? t('admin.students.detail.ageYearOne')
                      : t('admin.students.detail.ageYearOther', { count: ageYM.years })
                    : ''}
                  {ageYM.years > 0 && ageYM.months > 0 ? ' ' : ''}
                  {ageYM.months > 0
                    ? ageYM.months === 1
                      ? t('admin.students.detail.ageMonthOne')
                      : t('admin.students.detail.ageMonthOther', { count: ageYM.months })
                    : ''})
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
              const RowMoodIcon =
                att?.mood === 2
                  ? Smile
                  : att?.mood === 1
                    ? Meh
                    : att?.mood === 0
                      ? Frown
                      : null;
              const moodTitle =
                att?.mood === 2
                  ? t('admin.students.detail.mood.happy')
                  : att?.mood === 1
                    ? t('admin.students.detail.mood.neutral')
                    : att?.mood === 0
                      ? t('admin.students.detail.mood.sad')
                      : '';
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
                      {Array.isArray(s.target_vocabulary) &&
                      s.target_vocabulary.length > 0 ? (
                        <>
                          {' · '}
                          <span className="text-gold-300">
                            {s.target_vocabulary.slice(0, 4).join(' · ')}
                          </span>
                        </>
                      ) : null}
                    </p>
                    {att?.coach_notes ? (
                      <p className="mt-1 text-sm text-ink-200">{att.coach_notes}</p>
                    ) : null}
                  </div>
                  {RowMoodIcon ? (
                    <span
                      title={moodTitle}
                      aria-label={moodTitle}
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-ink-200"
                    >
                      <RowMoodIcon size={14} strokeWidth={2.4} aria-hidden />
                    </span>
                  ) : null}
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
