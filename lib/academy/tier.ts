import type { SupabaseClient } from '@supabase/supabase-js';

export type AcademyTier = 'bronze' | 'silver' | 'gold' | 'elite';

export type AcademyTierStats = {
  sessionsHeld: number;
  attendancePct: number | null;
  achievements: number;
};

/**
 * Cheap school-wide aggregate the sidebar shows under the user chip.
 * Uses countMethod='exact', head:true so each query is a count-only round trip
 * — the gauge is ambient information, never a blocker for the current page.
 */
export async function fetchAcademyStats(
  supabase: SupabaseClient,
  schoolId: string
): Promise<AcademyTierStats> {
  const [heldRes, attendanceRes, achievementsRes] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'held'),
    supabase.from('attendances').select('present'),
    supabase
      .from('student_objectives')
      .select('objective_id', { count: 'exact', head: true })
  ]);

  const sessionsHeld = heldRes.count ?? 0;
  const achievements = achievementsRes.count ?? 0;

  const rows = (attendanceRes.data ?? []) as Array<{ present: boolean }>;
  let attendancePct: number | null = null;
  if (rows.length > 0) {
    const present = rows.filter((r) => r.present).length;
    attendancePct = Math.round((present / rows.length) * 100);
  }

  return { sessionsHeld, attendancePct, achievements };
}

/**
 * Simple tier computation — bronze / silver / gold / elite — based on
 * sessions held + attendance %. The thresholds are intentionally
 * boring so the label moves as the school grows. Tweak freely.
 */
export function computeAcademyTier(stats: AcademyTierStats): AcademyTier {
  const pct = stats.attendancePct ?? 0;
  if (stats.sessionsHeld >= 300 && pct >= 85) return 'elite';
  if (stats.sessionsHeld >= 100 && pct >= 70) return 'gold';
  if (stats.sessionsHeld >= 30) return 'silver';
  return 'bronze';
}
