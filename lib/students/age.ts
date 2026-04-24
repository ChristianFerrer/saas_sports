/**
 * Returns the elapsed age as years + months between birth and `at`.
 * Counts a month as completed only when the day-of-month is reached,
 * so "born Feb 7, today Jul 5" returns 4 months not 5.
 */
export function ageYearsMonths(
  birthDate: string | null,
  at: Date = new Date()
): { years: number; months: number } | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;

  let years = at.getFullYear() - b.getFullYear();
  let months = at.getMonth() - b.getMonth();
  if (at.getDate() < b.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months };
}
