import type { GroupScheduleEntry } from '@/types/database';

export function parseSchedule(raw: string | null): GroupScheduleEntry[] | null {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const result: GroupScheduleEntry[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return null;
    const it = item as Record<string, unknown>;
    const weekday = Number(it.weekday);
    const duration = Number(it.duration_minutes);
    const start = typeof it.start_time === 'string' ? it.start_time : '';
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
    if (!/^\d{2}:\d{2}$/.test(start)) return null;
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) return null;
    result.push({
      weekday: weekday as GroupScheduleEntry['weekday'],
      start_time: start,
      duration_minutes: duration
    });
  }
  return result;
}
