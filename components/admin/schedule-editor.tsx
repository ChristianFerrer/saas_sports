'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { GroupScheduleEntry } from '@/types/database';

type Props = {
  defaultSchedule: GroupScheduleEntry[];
};

// Internal draft keeps duration as a raw string so users can temporarily
// empty the field without React re-rendering a stray "0" that would get
// prepended when they start typing (e.g. "045" instead of "45").
type SlotDraft = {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  duration_minutes: string;
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function toDraft(entry: GroupScheduleEntry): SlotDraft {
  return {
    weekday: entry.weekday,
    start_time: entry.start_time,
    duration_minutes: String(entry.duration_minutes)
  };
}

function serialize(items: SlotDraft[]): string {
  return JSON.stringify(
    items.map((it) => ({
      weekday: it.weekday,
      start_time: it.start_time,
      duration_minutes:
        it.duration_minutes === '' ? 0 : Number(it.duration_minutes)
    }))
  );
}

export function ScheduleEditor({ defaultSchedule }: Props) {
  const t = useTranslations('admin.groups.schedule');
  const [items, setItems] = useState<SlotDraft[]>(() =>
    defaultSchedule.map(toDraft)
  );

  function updateItem(i: number, patch: Partial<SlotDraft>) {
    setItems((curr) => curr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((curr) => [
      ...curr,
      { weekday: 1, start_time: '17:00', duration_minutes: '60' }
    ]);
  }

  function removeItem(i: number) {
    setItems((curr) => curr.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <label className="ss-label">{t('title')}</label>
        <p className="text-xs text-ink-300">{t('hint')}</p>
      </div>

      <input type="hidden" name="schedule_json" value={serialize(items)} />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white p-4 text-center text-xs text-ink-300">
          {t('empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/10 bg-white p-3"
            >
              <div className="flex items-end gap-2">
                <SlotField label={t('weekday')} className="min-w-0 flex-1">
                  <select
                    value={it.weekday}
                    onChange={(e) =>
                      updateItem(i, {
                        weekday: Number(e.target.value) as SlotDraft['weekday']
                      })
                    }
                    className="ss-input w-full truncate px-3 py-2 text-sm"
                  >
                    {WEEKDAYS.map((w) => (
                      <option key={w} value={w}>
                        {t(`weekdays.${w}`)}
                      </option>
                    ))}
                  </select>
                </SlotField>

                <SlotField label={t('start')} className="w-[104px] shrink-0">
                  <input
                    type="time"
                    value={it.start_time}
                    onChange={(e) => updateItem(i, { start_time: e.target.value })}
                    className="ss-input w-full px-2 py-2 text-sm"
                  />
                </SlotField>

                <SlotField label={t('duration')} className="w-[60px] shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={it.duration_minutes}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      updateItem(i, { duration_minutes: raw });
                    }}
                    className="ss-input w-full px-1 py-2 text-center text-sm tabular-nums"
                  />
                </SlotField>

                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label={t('remove')}
                  title={t('remove')}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-red-300 transition hover:bg-red-500/15 active:scale-95"
                >
                  <X size={16} strokeWidth={2.2} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addItem}
        className="ss-btn-secondary"
      >
        {t('add')}
      </button>
    </div>
  );
}

function SlotField({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ''}`}>
      <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-ink-300">
        {label}
      </span>
      {children}
    </label>
  );
}
