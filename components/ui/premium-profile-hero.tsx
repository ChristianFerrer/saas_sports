import type { ReactNode } from 'react';

type Meta = {
  label: string;
  value: ReactNode;
};

type Props = {
  /** Uppercase category / kicker (e.g. "JUGADOR SUB 8"). */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Initials rendered in the hero portrait when no photoUrl is given. */
  initials: string;
  /** Optional avatar image URL. */
  photoUrl?: string | null;
  /** Dorsal / jersey number shown next to the avatar (big, gold). */
  dorsal?: string | number | null;
  /** Grid of meta items (birth date, group, coach, enrolment…). */
  meta?: Meta[];
  /** Right-aligned content — typically a `<PremiumProgressRing />`. */
  rightSlot?: ReactNode;
  /** Extra actions/buttons under the title (e.g. Edit, Attendance). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Player-card hero used at the top of the Admin/Parent student detail
 * pages. Two-column on md+, stacks on mobile. Radial glow + subtle
 * stadium gradient for a premium "FIFA-style" feel.
 */
export function PremiumProfileHero({
  kicker,
  title,
  subtitle,
  initials,
  photoUrl,
  dorsal,
  meta,
  rightSlot,
  actions,
  className
}: Props) {
  return (
    <section
      className={`ss-card-strong relative overflow-hidden p-5 sm:p-7 ${className ?? ''}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-60"
      />
      <div className="relative z-10 grid items-start gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={title}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-white/10 sm:h-24 sm:w-24"
                />
              ) : (
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 text-[26px] font-bold text-gold-200 ring-1 ring-white/10 sm:h-24 sm:w-24 sm:text-[30px]">
                  {initials || '·'}
                </span>
              )}
              {dorsal != null && dorsal !== '' ? (
                <span
                  aria-hidden
                  className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-200 to-gold-500 text-[13px] font-extrabold text-navy-900 shadow-gold-glow ring-2 ring-navy-900"
                >
                  {dorsal}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              {kicker ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
                  {kicker}
                </p>
              ) : null}
              <h2 className="mt-0.5 break-words font-display text-2xl font-extrabold uppercase leading-[1.05] tracking-tight text-ink-50 sm:text-3xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-ink-200">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

          {meta && meta.length > 0 ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {meta.map((m, i) => (
                <div
                  key={`${m.label}-${i}`}
                  className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
                    {m.label}
                  </dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-ink-50">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {rightSlot ? (
          <div className="flex items-center justify-center md:justify-end">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </section>
  );
}
