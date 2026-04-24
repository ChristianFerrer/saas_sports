import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  MessageSquareQuote,
  Sparkles,
  Target,
  Trophy,
  XCircle
} from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/ui/app-shell';
import { PremiumAchievementBadge } from '@/components/ui/premium-achievement-badge';
import { PremiumProfileHero } from '@/components/ui/premium-profile-hero';
import { PremiumProgressBar } from '@/components/ui/premium-progress-bar';
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
  full_name: string;
  group_id: string | null;
  birth_date: string | null;
  enrolled_at: string | null;
  left_at: string | null;
};

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'held' | 'cancelled';
  group_id: string;
};

type AttendanceRow = {
  session_id: string;
  present: boolean;
  coach_notes: string | null;
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
    .select('id, full_name, group_id, birth_date, enrolled_at, left_at')
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
    messagesResult
  ] = await Promise.all([
    s.group_id
      ? supabase
          .from('groups')
          .select('id, name, school_id')
          .eq('id', s.group_id)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string; name: string; school_id: string } | null }),
    s.group_id
      ? supabase
          .from('class_sessions')
          .select('id, scheduled_at, duration_minutes, status, group_id')
          .eq('group_id', s.group_id)
          .order('scheduled_at', { ascending: false })
      : Promise.resolve({ data: [] as SessionRow[] }),
    supabase
      .from('attendances')
      .select('session_id, present, coach_notes')
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
      .limit(3)
  ]);

  const group = groupResult.data as {
    id: string;
    name: string;
    school_id: string;
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

  // Roadmap (same derivation as admin) — fetch school groups through group
  let schoolGroups: Array<{ id: string; name: string; created_at: string }> = [];
  if (group) {
    const { data: gs } = await supabase
      .from('groups')
      .select('id, name, created_at')
      .eq('school_id', group.school_id)
      .order('created_at', { ascending: true });
    schoolGroups = (gs ?? []) as Array<{ id: string; name: string; created_at: string }>;
  }
  const pastGroupIds = new Set<string>();
  for (const a of achievements) {
    if (a.objectives?.group_id && a.objectives.group_id !== s.group_id) {
      pastGroupIds.add(a.objectives.group_id);
    }
  }
  const roadmapSteps: RoadmapStep[] = schoolGroups.map((g) => {
    let state: RoadmapStep['state'];
    if (g.id === s.group_id) state = 'current';
    else if (pastGroupIds.has(g.id)) state = 'done';
    else state = 'upcoming';
    return { label: g.name, state };
  });
  if (roadmapSteps.length > 0) {
    roadmapSteps.push({
      label: t('admin.students.detail.futureLabel'),
      sub: t('admin.students.detail.futureSub'),
      state: 'dream'
    });
  }

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

  // Categorical progress bars — no schema for these yet, so we synthesise
  // from real signals: attendance drives "Compromiso", achieved
  // objectives drives "Técnica / Juego", and a soft constant keeps the
  // profile from looking empty until we add per-skill tracking.
  const totalObj = currentObjectives.length;
  const reachedObjCurrent = currentObjectives.filter((o) =>
    achievedIds.has(o.id)
  ).length;
  const objectivesPct =
    totalObj === 0 ? null : Math.round((reachedObjCurrent / totalObj) * 100);
  const categories: Array<{ label: string; value: number; tone: 'gold' | 'cyan' | 'emerald' | 'amber' }> = [
    {
      label: t('parent.detail.skills.commitment'),
      value: pct ?? 65,
      tone: 'cyan'
    },
    {
      label: t('parent.detail.skills.technique'),
      value: objectivesPct ?? 60,
      tone: 'gold'
    },
    {
      label: t('parent.detail.skills.confidence'),
      value: Math.min(100, (pct ?? 50) + (achievements.length > 0 ? 10 : 0)),
      tone: 'emerald'
    },
    {
      label: t('parent.detail.skills.teamwork'),
      value: 70,
      tone: 'amber'
    }
  ];

  const age = ageFromBirth(s.birth_date);

  const metaItems: Array<{ label: string; value: React.ReactNode }> = [];
  if (group) {
    metaItems.push({
      label: t('parent.detail.meta.group'),
      value: group.name
    });
  }
  if (age !== null) {
    metaItems.push({
      label: t('parent.detail.meta.age'),
      value: `${age} ${t('admin.students.detail.age')}`
    });
  }
  if (nextSession) {
    metaItems.push({
      label: t('parent.detail.meta.nextSession'),
      value: format.dateTime(new Date(nextSession.scheduled_at), {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'UTC'
      })
    });
  }

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

      <PremiumProfileHero
        kicker={t('parent.detail.heroKicker')}
        title={s.full_name}
        subtitle={positiveMessage}
        initials={initialsOf(s.full_name)}
        meta={metaItems}
        rightSlot={
          <PremiumProgressRing
            value={pct}
            size={148}
            strokeWidth={14}
            variant="gold"
            sublabel={t('parent.detail.attendance')}
          />
        }
      />

      {/* KPI row */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PremiumStatCard
          kicker={t('parent.detail.kpis.attendance')}
          icon={<CheckSquare size={18} strokeWidth={2.2} aria-hidden />}
          accent="cyan"
          value={pct === null ? '—' : `${pct}%`}
          sub={
            recorded.length === 0
              ? t('admin.students.detail.noAttendance')
              : `${presentCount}/${recorded.length}`
          }
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

      {/* Mi progreso — categorical bars */}
      <PremiumSectionTitle
        icon={<Sparkles size={14} strokeWidth={2.4} aria-hidden />}
        kicker={t('parent.detail.progress.kicker')}
        title={t('parent.detail.progress.title')}
      />
      <section className="ss-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <PremiumProgressBar
              key={c.label}
              label={c.label}
              value={c.value}
              tone={c.tone}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-400">{t('parent.detail.progress.note')}</p>
      </section>

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
