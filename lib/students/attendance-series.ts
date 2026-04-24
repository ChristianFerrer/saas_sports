import type { LinePoint } from '@/components/ui/premium-line-chart';

type Session = {
  id: string;
  scheduled_at: string;
};
type Attendance = { session_id: string; present: boolean };

const MONTH_LABELS_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC'
] as const;

/**
 * Returns the last `months` months of attendance %, ordered oldest -> newest.
 * A month with no recorded attendance is returned as null so the chart
 * breaks gracefully instead of dropping to 0.
 */
export function buildMonthlyAttendanceSeries(
  sessions: Session[],
  attendance: Attendance[],
  months = 10
): LinePoint[] {
  const byId = new Map<string, Attendance>();
  for (const a of attendance) byId.set(a.session_id, a);

  // { '2026-04': { present, total } }
  const buckets = new Map<string, { present: number; total: number }>();
  for (const s of sessions) {
    const att = byId.get(s.id);
    if (!att) continue;
    const d = new Date(s.scheduled_at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const curr = buckets.get(key) ?? { present: 0, total: 0 };
    curr.total += 1;
    if (att.present) curr.present += 1;
    buckets.set(key, curr);
  }

  // Emit the last N months ending on "this month" (UTC).
  const now = new Date();
  const out: LinePoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key);
    const value =
      b === undefined || b.total === 0
        ? null
        : Math.round((b.present / b.total) * 100);
    out.push({ label: MONTH_LABELS_ES[d.getUTCMonth()], value });
  }
  return out;
}
