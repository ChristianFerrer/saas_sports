import type { ReactNode } from 'react';

import { Languages } from 'lucide-react';

type Props = {
  /** Section title (e.g. "Vocabulario del trimestre"). */
  title: string;
  /** Small kicker above the title. */
  kicker: string;
  /** All target words for the trimester (union of session targets). */
  termWords: string[];
  /** Words this kid recognises. */
  knownWords: string[];
  /** Words this kid uses on her own. */
  usedWords: string[];
  /** Caption with the count (e.g. "12/24 palabras reconocidas"). */
  trackerLabel: string;
  /** Words being worked this week (most recent session). */
  weekWords?: string[];
  weekLabel?: string;
  /** Localised legend strings. */
  knownLegend: string;
  usedLegend: string;
  /** Shown when termWords is empty. */
  emptyHint: string;
  /** Optional action area (edit button, etc.). */
  action?: ReactNode;
};

/**
 * Term English vocabulary tracker for the Little Kickers methodology.
 * Renders the union of words worked across the trimester's sessions
 * as chips, with their state (recognised / used spontaneously).
 */
export function VocabularyPanel({
  title,
  kicker,
  termWords,
  knownWords,
  usedWords,
  trackerLabel,
  weekWords,
  weekLabel,
  knownLegend,
  usedLegend,
  emptyHint,
  action
}: Props) {
  const knownSet = new Set(knownWords.map((w) => w.toLowerCase()));
  const usedSet = new Set(usedWords.map((w) => w.toLowerCase()));
  const sortedWords = [...new Set(termWords.map((w) => w.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );

  return (
    <section className="ss-card p-4 sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="ss-kicker flex items-center gap-1.5 text-gold-300">
            <Languages size={12} strokeWidth={2.4} aria-hidden />
            {kicker}
          </p>
          <h3 className="mt-0.5 text-[15px] font-bold text-ink-50">{title}</h3>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <p className="mb-3 text-xs font-semibold tabular-nums text-ink-200">
        {trackerLabel}
      </p>

      {sortedWords.length === 0 ? (
        <p className="text-sm text-ink-300">{emptyHint}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {sortedWords.map((w) => {
              const lc = w.toLowerCase();
              const used = usedSet.has(lc);
              const known = knownSet.has(lc);
              const cls = used
                ? 'inline-flex items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-2.5 py-1 text-[12px] font-bold text-navy-900 shadow-gold-glow'
                : known
                  ? 'inline-flex items-center rounded-full border border-gold-400/40 bg-gold-400/[0.08] px-2.5 py-1 text-[12px] font-semibold text-gold-200'
                  : 'inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-ink-300';
              return (
                <li key={w}>
                  <span className={cls}>{w}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-300">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full border border-gold-400/40 bg-gold-400/[0.08]"
              />
              {knownLegend}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full bg-gradient-to-br from-gold-300 to-gold-500"
              />
              {usedLegend}
            </span>
          </div>

          {weekWords && weekWords.length > 0 && weekLabel ? (
            <p className="mt-3 text-[11px] text-ink-300">
              <span className="font-semibold uppercase tracking-[0.12em] text-gold-300">
                {weekLabel}:
              </span>{' '}
              {weekWords.join(' · ')}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
