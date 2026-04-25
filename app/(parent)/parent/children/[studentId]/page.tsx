import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Frown,
  Meh,
  MessageSquareQuote,
  Smile,
  Target,
  Trophy,
  XCircle
} from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

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
  full_name: string;
  group_id: string | null;
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

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  group_id: string;
  target_vocabulary: string[] | null;
};

type AttendanceRow = {
  session_id: string;
  present: boolean;
  coach_notes: string | null;
  mood: number | null;
};

type CurrentObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
};

type ParentAchievementRow = {
  objective_id: string;
  achieved_at: string;
  objectives: {
    id: string;
    title: string;
    description: string | null;
    group_id: string;
  } | null;
};

type CommunicationRow = {
  id: string;
  subject: string;
  content: string;
  sent_at: string | null;
  created_at: string;
};

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function ParentChildPage({
  params
}: {
  params: { studentId: string };
}) {
  const user = await requireRole('parent');
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = createUntypedClient();

  const { data: link } = await supabase
    .from('student_parents')
    .select('student_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', params.studentId)
    .maybeSingle();
  if (!link) notFound();

  const { data: student } = await supabase
    .from('students')
    .select(
      'id, full_name, group_id, birth_date, enrolled_at, left_at, ' +
        'dorsal_number, position, dominant_foot, height_cm, weight_kg, photo_url, ' +
        'english_vocab_known, english_vocab_used'
    )
    .eq('id', params.studentId)
    .maybeSingle();

  const s = student as StudentRow | null;
  if (!s) notFound();

  const [
    groupResult,
    sessionsResult,
    attendanceResult,
    currentObjectivesResult,
    achievementsResult,
    messagesResult,
    skillsResult,
    snapshotsResult
  ] = await Promise.all([
    s.group_id
      ? supabase
          .from('groups')
          .select('id, name, school_id, lk_level, start_date, end_date')
          .eq('id', s.group_id)
          .maybeSingle()
      : Promise.resolve({
          data: null as {
            id: string;
            name: string;
            school_id: string;
            lk_level: LkLevel | null;
            start_date: string | null;
            end_date: string | null;
          } | null
        }),
    s.group_id
      ? supabase
          .from('class_sessions')
          .select(
            'id, scheduled_at, duration_minutes, status, group_id, target_vocabulary'
          )
          .eq('group_id', s.group_id)
          .order('scheduled_at', { ascending: false })
      : Promise.resolve({ data: [] as SessionRow[] }),
    supabase
      .from('attendances')
      .select('session_id, present, coach_notes, mood')
      .eq('student_id', s.id),
    s.group_id
      ? supabase
          .from('objectives')
          .select('id, title, description, display_order')
          .eq('group_id', s.group_id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as CurrentObjectiveRow[] }),
    supabase
      .from('student_objectives')
      .select(
        'objective_id, achieved_at, objectives (id, title, description, group_id)'
      )
      .eq('student_id', s.id)
      .order('achieved_at', { ascending: false }),
    supabase
      .from('communication_recipients')
      .select(
        'communication_id, communications (id, subject, content, sent_at, created_at)'
      )
      .eq('parent_user_id', user.id)
      .order('communication_id', { ascending: false })
      .limit(3),
    supabase.from('student_skills').select('skill, value').eq('student_id', s.id),
    supabase
      .from('student_skill_snapshots')
      .select('captured_month, value')
      .eq('student_id', s.id)
      .order('captured_month', { ascending: true })
  ]);

  const group = groupResult.data as {
    id: string;
    name: string;
    school_id: string;
    lk_level: LkLevel | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
  const allSessions = (sessionsResult.data ?? []) as SessionRow[];
  const currentObjectives = (currentObjectivesResult.data ?? []) as CurrentObjectiveRow[];
  const achievements = (achievementsResult.data ?? []) as unknown as ParentAchievementRow[];
  const achievedIds = new Set(achievements.map((a) => a.objective_id));

  // Scope sessions to enrollment window
  const enrolledMs = s.enrolled_at
    ? new Date(s.enrolled_at + 'T00:00:00Z').getTime()
    : -Infinity;
  const leftMs = s.left_at ? new Date(s.left_at + 'T23:59:59Z').getTime() : Infinity;
  const sessions = allSessions.filter((ss) => {
    const ts = new Date(ss.scheduled_at).getTime();
    return ts >= enrolledMs && ts <= leftMs;
  });

  // Attendance bySession + stats
  const attendanceBySession = new Map<string, AttendanceRow>();
  for (const a of (attendanceResult.data ?? []) as AttendanceRow[]) {
    attendanceBySession.set(a.session_id, a);
  }
  const recorded = sessions.filter((ss) => attendanceBySession.has(ss.id));
  const presentCount = recorded.filter(
    (ss) => attendanceBySession.get(ss.id)?.present
  ).length;
  const pct = recorded.length === 0 ? null : Math.round((presentCount / recorded.length) * 100);

  // Next session
  const now = Date.now();
  const nextSession = sessions
    .filter((ss) => new Date(ss.scheduled_at).getTime() >= now)
    .slice()
    .reverse()[0];

  // LK roadmap (4 fixed programmes + Graduación). Past levels inferred
  // from previous groups with achievements that had a lk_level set.
  let schoolGroups: Array<{
    id: string;
    name: string;
    created_at: string;
    display_order: number;
    lk_level: LkLevel | null;
  }> = [];
  if (group) {
    const { data: gs } = await supabase
      .from('groups')
      .select('id, name, created_at, display_order, lk_level')
      .eq('school_id', group.school_id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    schoolGroups = (gs ?? []) as Array<{
      id: string;
      name: string;
      created_at: string;
      display_order: number;
      lk_level: LkLevel | null;
    }>;
  }
  const pastGroupIds = new Set<string>();
  for (const a of achievements) {
    if (a.objectives?.group_id && a.objectives.group_id !== s.group_id) {
      pastGroupIds.add(a.objectives.group_id);
    }
  }
  const pastLevels = new Set<LkLevel>();
  for (const g of schoolGroups) {
    if (g.lk_level && pastGroupIds.has(g.id)) pastLevels.add(g.lk_level);
  }
  const currentLkLevel: LkLevel | null =
    group?.lk_level ?? lkLevelFromAge(s.birth_date);
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

  // Latest coach message (just the most recent communication for this parent).
  const latestMessage = (messagesResult.data ?? [])
    .map(
      (r) =>
        (r as unknown as { communications: CommunicationRow | null }).communications
    )
    .filter((c): c is CommunicationRow => c !== null)
    .sort((a, b) => {
      const ta = new Date(a.sent_at ?? a.created_at).getTime();
      const tb = new Date(b.sent_at ?? b.created_at).getTime();
      return tb - ta;
    })[0];

  // Positive auto-message — pick a tone based on attendance + achievements.
  const positiveMessage =
    pct !== null && pct >= 80
      ? t('parent.detail.positive.high')
      : pct !== null && pct >= 50
        ? t('parent.detail.positive.mid')
        : achievements.length > 0
          ? t('parent.detail.positive.mid')
          : t('parent.detail.positive.low');

  // Badge progress = sub-skills achieved this term / total
  const totalObj = currentObjectives.length;
  const reachedObjCurrent = currentObjectives.filter((o) =>
    achievedIds.has(o.id)
  ).length;
  const badgePct =
    totalObj === 0 ? null : Math.round((reachedObjCurrent / totalObj) * 100);

  const skillRows = (skillsResult.data ?? []) as Array<{
    skill: string;
    value: number;
  }>;
  const skillByKey = new Map<string, number>();
  for (const sr of skillRows) skillByKey.set(sr.skill, sr.value);

  const ageYM = ageYearsMonths(s.birth_date);

  // Term tag and label for the player card / progress panel.
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

  // Player-card meta lines: "Programa LK · Grupo" + DOB con años/meses
  const playerMetaLines: string[] = [];
  const lkLevelLabel = currentLkLevel
    ? t(`admin.students.detail.lkLevel.${currentLkLevel}` as const)
    : null;
  if (lkLevelLabel || group) {
    playerMetaLines.push([lkLevelLabel, group?.name].filter(Boolean).join(' · '));
  }
  if (s.birth_date) {
    const dob = format.dateTime(new Date(s.birth_date), {
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

  const playerStats: Array<{ label: string; value: React.ReactNode }> = [];
  if (s.enrolled_at) {
    playerStats.push({
      label: t('admin.students.detail.firstClass'),
      value: format.dateTime(new Date(s.enrolled_at), {
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
  if (s.height_cm) {
    playerStats.push({
      label: t('admin.students.detail.height'),
      value: `${s.height_cm} cm`
    });
  }
  if (s.weight_kg) {
    playerStats.push({
      label: t('admin.students.detail.weight'),
      value: `${s.weight_kg} kg`
    });
  }
  if (s.dominant_foot) {
    playerStats.push({
      label: t('admin.students.detail.dominantFoot'),
      value:
        s.dominant_foot === 'right'
          ? t('admin.students.fields.dominantFootRight')
          : s.dominant_foot === 'left'
            ? t('admin.students.fields.dominantFootLeft')
            : t('admin.students.fields.dominantFootBoth')
    });
  }

  // Mi progreso — 5 LK skills + monthly perception line. Big ring is
  // % of badge sub-skills unlocked this term (matches LK methodology).
  const snapshots = (snapshotsResult.data ?? []) as Array<{
    captured_month: string;
    value: number;
  }>;
  const skillItems = SKILL_KEYS.map((k: SkillKey) => ({
    key: k,
    label: t(`parent.detail.skills.${k}` as const),
    value: skillByKey.get(k) ?? 0
  }));
  const softSkillItems = SOFT_SKILL_KEYS.map((k: SoftSkillKey) => ({
    key: k,
    label: t(`admin.students.detail.softSkillsValues.${k}` as const),
    value: skillByKey.get(k) ?? 0
  }));
  const progressSeries = buildMonthlySkillSeries(snapshots, 10);
  const encouragingScore =
    badgePct !== null && badgePct >= 70
      ? t('admin.students.detail.progress.encouragingHigh')
      : badgePct !== null && badgePct >= 50
        ? t('admin.students.detail.progress.encouragingMid')
        : badgePct !== null
          ? t('admin.students.detail.progress.encouragingLow')
          : null;

  // Mood average for the disfrute KPI.
  const moodValues: number[] = [];
  for (const a of attendanceBySession.values()) {
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
  const moodSub =
    moodAvg === null
      ? t('parent.detail.kpis.moodSubEmpty')
      : moodAvg >= 1.5
        ? t('parent.detail.kpis.moodSubHigh')
        : moodAvg >= 0.8
          ? t('parent.detail.kpis.moodSubMid')
          : t('parent.detail.kpis.moodSubLow');
  const moodIcon =
    moodAvg === null ? Meh : moodAvg >= 1.5 ? Smile : moodAvg >= 0.8 ? Meh : Frown;
  const MoodIcon = moodIcon;

  // Vocabulary aggregates (term words) and last session's words.
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
  const knownWords = s.english_vocab_known ?? [];
  const usedWords = s.english_vocab_used ?? [];

  return (
    <AppShell
      title={s.full_name}
      role={t('roles.parent')}
      fullName={user.profile.full_name}
      kicker={group ? group.name : t('admin.students.unassigned')}
    >
      <Link
        href="/parent"
        className="mb-4 inline-flex items-center gap-1 text-xs text-ink-300 transition hover:text-ink-100"
      >
        <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
        {t('parent.home.title')}
      </Link>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <PremiumPlayerCard
          fullName={s.full_name}
          initials={initialsOf(s.full_name)}
          photoUrl={s.photo_url}
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
          series={progressSeries}
          encouragingLine={encouragingScore ?? positiveMessage}
          emptyHint={t('admin.students.detail.progress.emptySeries')}
        />
      </div>

      {s.left_at ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-300">
          {t('admin.students.detail.inactive')}
        </p>
      ) : null}

      {/* Monthly attendance trend */}
      {(() => {
        const series = buildMonthlyAttendanceSeries(
          sessions.map((ss) => ({ id: ss.id, scheduled_at: ss.scheduled_at })),
          Array.from(attendanceBySession.values()).map((a) => ({
            session_id: a.session_id,
            present: a.present
          })),
          10
        );
        const hasAny = series.some((p) => p.value !== null);
        if (!hasAny) return null;
        return (
          <section className="ss-card mt-5 p-4 sm:p-5">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="ss-kicker text-gold-300">
                  {t('parent.detail.trend.kicker')}
                </p>
                <h3 className="mt-0.5 text-[15px] font-bold text-ink-50">
                  {t('parent.detail.trend.title')}
                </h3>
              </div>
              <span className="ss-pill-mute">
                {t('parent.detail.trend.lastMonths', { count: 10 })}
              </span>
            </div>
            <PremiumLineChart data={series} height={180} variant="gold" />
          </section>
        );
      })()}

      {/* KPI row — Disfrute medio · Sub-skills · Próxima clase */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PremiumStatCard
          kicker={t('parent.detail.kpis.mood')}
          icon={<MoodIcon size={18} strokeWidth={2.2} aria-hidden />}
          accent="cyan"
          value={moodLabel}
          sub={moodSub}
        />
        <PremiumStatCard
          kicker={t('parent.detail.kpis.objectives')}
          icon={<Target size={18} strokeWidth={2.2} aria-hidden />}
          accent="gold"
          value={totalObj === 0 ? '—' : `${reachedObjCurrent}/${totalObj}`}
          sub={t('parent.detail.kpis.objectivesSub')}
        />
        <PremiumStatCard
          kicker={t('parent.detail.kpis.nextSession')}
          icon={<Calendar size={18} strokeWidth={2.2} aria-hidden />}
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

      {/* Soft skills (read-only) */}
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

      {/* Roadmap */}
      {roadmapSteps.length > 0 ? (
        <>
          <PremiumSectionTitle
            kicker={t('admin.students.detail.roadmap.kicker')}
            title={t('admin.students.detail.roadmap.title')}
          />
          <PremiumTimelineRoadmap
            steps={roadmapSteps}
            caption={t('parent.detail.roadmap.caption')}
          />
        </>
      ) : null}

      {/* Objectives (read-only) */}
      {currentObjectives.length > 0 ? (
        <>
          <PremiumSectionTitle
            icon={<Target size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('parent.detail.objectives.kicker')}
            title={t('parent.objectives.current', {
              group: group?.name ?? t('admin.students.unassigned')
            })}
          />
          <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
            {currentObjectives.map((o) => {
              const achieved = achievedIds.has(o.id);
              return (
                <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={
                      achieved
                        ? 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-navy-900 shadow-gold-glow'
                        : 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-300'
                    }
                  >
                    {achieved ? (
                      <CheckSquare size={16} strokeWidth={2.6} />
                    ) : (
                      <Target size={14} strokeWidth={2.4} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        achieved
                          ? 'truncate font-semibold text-ink-50'
                          : 'truncate font-medium text-ink-100'
                      }
                    >
                      {o.title}
                    </p>
                    {o.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-300">
                        {o.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={achieved ? 'ss-pill-gold shrink-0' : 'ss-pill-mute shrink-0'}
                  >
                    {achieved
                      ? t('parent.objectives.statusAchieved')
                      : t('parent.objectives.statusPending')}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* Achievements */}
      {achievements.length > 0 ? (
        <>
          <PremiumSectionTitle
            icon={<Trophy size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('parent.detail.achievements.kicker')}
            title={t('parent.detail.achievements.title')}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {achievements.slice(0, 12).map((a) => {
              if (!a.objectives) return null;
              return (
                <PremiumAchievementBadge
                  key={`${a.objectives.id}-${a.achieved_at}`}
                  title={a.objectives.title}
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

      {/* Coach message */}
      {latestMessage ? (
        <>
          <PremiumSectionTitle
            icon={<MessageSquareQuote size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('parent.detail.message.kicker')}
            title={t('parent.detail.message.title')}
            action={
              <Link
                href="/parent/messages"
                className="text-xs font-semibold text-gold-300 hover:text-gold-200"
              >
                {t('parent.detail.message.seeAll')}
              </Link>
            }
          />
          <Link
            href={`/parent/messages/${latestMessage.id}`}
            className="ss-card block p-4 transition hover:border-white/15 hover:shadow-pop sm:p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-300">
              {format.dateTime(
                new Date(latestMessage.sent_at ?? latestMessage.created_at),
                { dateStyle: 'medium', timeStyle: 'short' }
              )}
            </p>
            <h4 className="mt-1 text-[15px] font-bold text-ink-50">
              {latestMessage.subject}
            </h4>
            <p className="mt-2 line-clamp-3 text-sm text-ink-200">
              {latestMessage.content}
            </p>
          </Link>
        </>
      ) : null}

      {/* Recent attendance */}
      {sessions.length > 0 ? (
        <>
          <PremiumSectionTitle
            icon={<CheckSquare size={14} strokeWidth={2.4} aria-hidden />}
            kicker={t('parent.detail.recent.kicker')}
            title={t('parent.attendance.historyTitle')}
          />
          <ul className="ss-card divide-y divide-white/[0.05] overflow-hidden">
            {sessions.slice(0, 8).map((ss) => {
              const att = attendanceBySession.get(ss.id);
              const display = format.dateTime(new Date(ss.scheduled_at), {
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
                <li key={ss.id} className="flex items-start gap-3 px-4 py-3">
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
                      <Target size={14} strokeWidth={2.4} />
                    ) : att.present ? (
                      <CheckCircle2 size={16} strokeWidth={2.4} />
                    ) : (
                      <XCircle size={16} strokeWidth={2.4} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-50">{display}</p>
                    <p className="text-xs text-ink-300">
                      {t(`admin.attendance.status.${ss.status}`)} ·{' '}
                      {ss.duration_minutes} {t('admin.attendance.minutes')}
                      {Array.isArray(ss.target_vocabulary) &&
                      ss.target_vocabulary.length > 0 ? (
                        <>
                          {' · '}
                          <span className="text-gold-300">
                            {ss.target_vocabulary.slice(0, 4).join(' · ')}
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
