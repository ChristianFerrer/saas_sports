import type { ReactNode } from 'react';

type Props = {
  /** Small all-caps label above the title. */
  kicker?: string;
  /** Main section title; auto uppercase when kicker-less. */
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Premium section header used across dashboards: a narrow gold bar,
 * optional icon, kicker + title, and an optional right-aligned action
 * (link/button). Keep the aesthetic consistent across Admin/Coach/Parent
 * surfaces.
 */
export function PremiumSectionTitle({
  kicker,
  title,
  icon,
  action,
  className
}: Props) {
  return (
    <div className={`mt-6 mb-3 flex items-end justify-between gap-3 ${className ?? ''}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className="h-5 w-[3px] rounded-full bg-gradient-to-b from-gold-200 to-gold-500"
        />
        {icon ? <span className="shrink-0 text-ink-300">{icon}</span> : null}
        <div className="min-w-0">
          {kicker ? <p className="ss-kicker">{kicker}</p> : null}
          <h3 className="truncate text-[15px] font-bold tracking-tight text-ink-50">
            {title}
          </h3>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
