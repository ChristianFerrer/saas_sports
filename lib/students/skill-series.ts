import type { LinePoint } from '@/components/ui/premium-line-chart';

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

type Snapshot = {
  captured_month: string; // YYYY-MM-01
  value: number;
};

/**
 * Returns the global per-month average across every snapshot row in
 * the given window, ordered oldest -> newest. A month with no
 * snapshots emits null so the line chart breaks gracefully.
 */
export function buildMonthlySkillSeries(
  snapshots: Snapshot[],
  months = 10
): LinePoint[] {
  const buckets = new Map<string, number[]>();
  for (const s of snapshots) {
    const key = s.captured_month.slice(0, 7); // YYYY-MM
    const arr = buckets.get(key) ?? [];
    arr.push(s.value);
    buckets.set(key, arr);
  }

  const now = new Date();
  const out: LinePoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const values = buckets.get(key);
    const avg =
      values && values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
    out.push({ label: MONTH_LABELS_ES[d.getUTCMonth()], value: avg });
  }
  return out;
}

/**
 * Computes the season label ("2024/25") from a date. Aug-Jul boundary.
 */
export function seasonLabel(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0=Jan, 7=Aug
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}/${String(endYear).slice(-2)}`;
}
