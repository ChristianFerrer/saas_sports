import type { LkLevel } from '@/types/database';

/**
 * Fixed Little Kickers programmes, ordered by age. Used for the
 * roadmap timeline on the student detail and to derive labels
 * everywhere a programme name needs to appear.
 */
export const LK_LEVELS: ReadonlyArray<{
  key: LkLevel;
  ageMin: number; // inclusive, in years
  ageMax: number; // exclusive, in years
}> = [
  { key: 'little_kicks', ageMin: 1.5, ageMax: 2.5 },
  { key: 'junior', ageMin: 2.5, ageMax: 3.5 },
  { key: 'mighty', ageMin: 3.5, ageMax: 5 },
  { key: 'mega', ageMin: 5, ageMax: 8 }
];

const ORDER: Record<LkLevel, number> = {
  little_kicks: 0,
  junior: 1,
  mighty: 2,
  mega: 3
};

export function lkLevelOrder(level: LkLevel): number {
  return ORDER[level];
}

export function isLkLevel(value: string): value is LkLevel {
  return value in ORDER;
}

/**
 * Heuristic: pick the LK programme that matches the kid's age.
 * Returns null when there's no birth date or the age is out of range.
 */
export function lkLevelFromAge(birthDate: string | null): LkLevel | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const ms = Date.now() - b.getTime();
  const years = ms / (365.25 * 24 * 60 * 60 * 1000);
  for (const lvl of LK_LEVELS) {
    if (years >= lvl.ageMin && years < lvl.ageMax) return lvl.key;
  }
  return null;
}
