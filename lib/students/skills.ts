/**
 * Canonical list of "Mi progreso" skill dimensions. Stored as plain
 * text keys in student_skills.skill so the set is easy to extend
 * without a migration; the UI renders whatever keys are in this list.
 */
export const SKILL_KEYS = [
  'technique',
  'physical',
  'tactical',
  'mental',
  'social'
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export function isSkillKey(value: string): value is SkillKey {
  return (SKILL_KEYS as readonly string[]).includes(value);
}
