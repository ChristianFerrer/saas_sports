type Props = {
  size?: number;
  className?: string;
  variant?: 'solid' | 'outline';
};

/**
 * Premium monogram for SmartSpots: a soft rounded shield with an
 * angled "S"-like spark on a gold gradient. Designed to read at 20px
 * and still feel rich at 64px+. Uses stop-ids scoped per render so
 * multiple marks on the same page don't collide.
 */
// Fixed gradient ids so multiple marks on the same page share <defs> safely
// and SSR/CSR render identical HTML (avoids hydration mismatches).
const GOLD_ID = 'ss-brand-gold';
const SHEEN_ID = 'ss-brand-sheen';

export function BrandMark({ size = 32, className, variant = 'solid' }: Props) {
  const gold = GOLD_ID;
  const sheen = SHEEN_ID;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fce9ad" />
          <stop offset="50%" stopColor="#f4c355" />
          <stop offset="100%" stopColor="#a87212" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {variant === 'solid' ? (
        <>
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="13"
            fill={`url(#${gold})`}
          />
          <rect
            x="2"
            y="2"
            width="44"
            height="22"
            rx="13"
            fill={`url(#${sheen})`}
          />
        </>
      ) : (
        <rect
          x="2.5"
          y="2.5"
          width="43"
          height="43"
          rx="13"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="2"
        />
      )}
      {/* Stylised "S": two arcs suggesting motion. */}
      <path
        d="M33.5 15.5c-2.6-2.2-6.1-3.3-9.5-3.1-4.8.3-8.5 3.1-8.5 6.9 0 3.5 3.2 5.2 8.4 6.4 4.9 1.1 7.2 2.2 7.2 4.2 0 2.2-2.7 3.8-6.6 3.8-3.2 0-6.1-1-8.3-2.7"
        fill="none"
        stroke={variant === 'solid' ? '#1a1205' : `url(#${gold})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small spark top-right to hint at "spot". */}
      <circle cx="36" cy="13" r="1.8" fill={variant === 'solid' ? '#1a1205' : `url(#${gold})`} />
    </svg>
  );
}

/**
 * Horizontal wordmark for sidebar / auth card headers.
 */
export function BrandWordmark({
  size = 28,
  className
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ''}`}
    >
      <BrandMark size={size} />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-[0.18em] text-ink-50">
          SMARTSPOTS
        </span>
        <span className="text-[9px] font-semibold tracking-[0.32em] text-gold-300">
          ACADEMY
        </span>
      </span>
    </span>
  );
}
