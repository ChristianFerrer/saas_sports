import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  kicker: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  /** 'gold' / 'cyan' tints the icon tile. */
  accent?: 'gold' | 'cyan' | 'emerald' | 'mute';
  href?: string;
  className?: string;
  children?: ReactNode;
};

const ACCENT_BG: Record<NonNullable<Props['accent']>, string> = {
  gold: 'bg-gradient-to-br from-gold-300/25 to-gold-600/15 text-gold-200 ring-1 ring-gold-400/20',
  cyan: 'bg-gradient-to-br from-cyan-400/25 to-cyan-600/15 text-cyan-300 ring-1 ring-cyan-400/20',
  emerald:
    'bg-gradient-to-br from-emerald-400/25 to-emerald-600/15 text-emerald-300 ring-1 ring-emerald-400/20',
  mute: 'bg-white/[0.05] text-ink-200 ring-1 ring-white/5'
};

/**
 * Compact KPI surface: icon tile + kicker + big value + optional sub.
 * When `href` is set, the whole card becomes a link with a chevron
 * affordance and a hover lift.
 */
export function PremiumStatCard({
  kicker,
  value,
  sub,
  icon,
  accent = 'cyan',
  href,
  className,
  children
}: Props) {
  const inner = (
    <>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ACCENT_BG[accent]}`}>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="ss-kicker">{kicker}</p>
          <p className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-ink-50 sm:text-[28px]">
            {value}
          </p>
          {sub ? <p className="mt-0.5 text-xs text-ink-300">{sub}</p> : null}
        </div>
        {href ? (
          <ArrowUpRight
            size={18}
            strokeWidth={2}
            className="shrink-0 text-ink-300 transition group-hover:text-ink-100"
            aria-hidden
          />
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </>
  );

  const wrapperClass = `ss-card group p-4 sm:p-5 ${
    href ? 'transition hover:border-white/15 hover:shadow-pop' : ''
  } ${className ?? ''}`;

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {inner}
      </Link>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}
