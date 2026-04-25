import type { ReactNode } from 'react';

type Stat = {
  label: string;
  value: ReactNode;
  /** Optional small icon element. */
  icon?: ReactNode;
};

type Props = {
  /** ALL CAPS title rendered as the player name. */
  fullName: string;
  /** Initials fallback when there's no photo. */
  initials: string;
  /** Optional photo URL. Rendered as the right-side hero image. */
  photoUrl?: string | null;
  /** Lines of meta below the name (e.g. "Delantero · Sub 6"). */
  meta: string[];
  /**
   * Big highlighted block on the left. Originally the jersey number;
   * also used for the LK trimester tag (e.g. "Q3"). Accepts numbers
   * or short strings. If null/undefined the block is hidden.
   */
  dorsal?: ReactNode;
  dorsalLabel: string;
  /** 1-3 stat cells rendered along the bottom (Altura / Peso / Pierna…). */
  stats?: Stat[];
};

function isHiddenDorsal(d: ReactNode): boolean {
  if (d == null) return true;
  if (d === 0 || d === '0' || d === '') return true;
  return false;
}

/**
 * Player-card hero used at the top of the student detail (admin and
 * parent). Two-zone layout: a deep-navy info block on the left and a
 * dimmed photo (with a stadium-light glow) on the right. Mobile
 * stacks naturally because the photo is a `<img>` not a background.
 */
export function PremiumPlayerCard({
  fullName,
  initials,
  photoUrl,
  meta,
  dorsal,
  dorsalLabel,
  stats
}: Props) {
  return (
    <section className="ss-card-strong relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-grad-hero opacity-80"
      />
      <div className="relative z-10 grid items-stretch gap-0 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Left info block */}
        <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 className="break-words font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink-50 sm:text-4xl">
              {fullName}
            </h2>
            {meta.length > 0 ? (
              <ul className="mt-3 space-y-0.5 text-[13px] text-ink-200">
                {meta.map((line, i) => (
                  <li key={`${line}-${i}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {!isHiddenDorsal(dorsal) ? (
            <div className="mt-1">
              <p className="font-display text-5xl font-extrabold leading-none text-gradient-gold sm:text-6xl">
                {dorsal}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
                {dorsalLabel}
              </p>
            </div>
          ) : null}

          {stats && stats.length > 0 ? (
            <dl className="mt-auto grid grid-cols-3 gap-2">
              {stats.map((s, i) => (
                <div
                  key={`${s.label}-${i}`}
                  className="rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1 truncate text-sm font-bold text-ink-50">
                    {s.icon ? (
                      <span className="shrink-0 text-ink-300">{s.icon}</span>
                    ) : null}
                    <span className="truncate">{s.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Right photo block */}
        <div className="relative min-h-[260px] sm:min-h-0">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-l from-transparent via-navy-900/40 to-navy-900"
          />
          {photoUrl ? (
            // Photos may live on third-party hosts the user pasted; skip
            // next/image optimisation to avoid configuring remote
            // patterns for arbitrary domains.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={fullName}
              className="h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center">
              <span className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-4xl font-extrabold text-gold-200 ring-1 ring-white/10">
                {initials || '·'}
              </span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 right-[-10%] h-40 w-40 rounded-full bg-gold-400/15 blur-3xl"
          />
        </div>
      </div>
    </section>
  );
}
