/**
 * Canonical list of "Mi progreso" skill dimensions for the Little
 * Kickers methodology: how the kid thinks (cognitive), moves
 * (physical), plays (football), communicates (english) and relates
 * (social). Stored as plain text keys in student_skills.skill so
 * historic rows for older catalogs survive untouched but stop being
 * shown.
 */
export const SKILL_KEYS = [
  'cognitive',
  'physical',
  'football',
  'english',
  'social'
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

/**
 * Soft-skill dimensions tracked alongside the hard skills. Same
 * student_skills storage, separate UI block. These are the metrics
 * a Little Kickers parent values most: independence, social
 * confidence, ability to follow the coach.
 */
export const SOFT_SKILL_KEYS = [
  'independence',
  'social_confidence',
  'follows_instructions'
] as const;

export type SoftSkillKey = (typeof SOFT_SKILL_KEYS)[number];

export type AnySkillKey = SkillKey | SoftSkillKey;

const ALL_KEYS: readonly string[] = [...SKILL_KEYS, ...SOFT_SKILL_KEYS];

export function isSkillKey(value: string): value is SkillKey {
  return (SKILL_KEYS as readonly string[]).includes(value);
}

export function isSoftSkillKey(value: string): value is SoftSkillKey {
  return (SOFT_SKILL_KEYS as readonly string[]).includes(value);
}

export function isAnySkillKey(value: string): value is AnySkillKey {
  return ALL_KEYS.includes(value);
}
