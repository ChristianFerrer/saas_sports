'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { GroupScheduleEntry } from '@/types/database';

type Props = {
  defaultSchedule: GroupScheduleEntry[];
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function ScheduleEditor({ defaultSchedule }: Props) {
  const t = useTranslations('admin.groups.schedule');
  const [items, setItems] = useState<GroupScheduleEntry[]>(defaultSchedule);

  function updateItem(i: number, patch: Partial<GroupScheduleEntry>) {
    setItems((curr) => curr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((curr) => [
      ...curr,
      { weekday: 1, start_time: '17:00', duration_minutes: 60 }
    ]);
  }

  function removeItem(i: number) {
    setItems((curr) => curr.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">{t('title')}</label>
      <p className="text-xs text-slate-500">{t('hint')}</p>

      <input type="hidden" name="schedule_json" value={JSON.stringify(items)} />

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
          {t('empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 rounded-md border border-slate-200 bg-white p-2"
            >
              <div>
                <label className="block text-xs text-slate-500">{t('weekday')}</label>
                <select
                  value={it.weekday}
                  onChange={(e) =>
                    updateItem(i, {
                      weekday: Number(e.target.value) as GroupScheduleEntry['weekday']
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w} value={w}>
                      {t(`weekdays.${w}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500">{t('start')}</label>
                <input
                  type="time"
                  value={it.start_time}
                  onChange={(e) => updateItem(i, { start_time: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">{t('duration')}</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={it.duration_minutes}
                  onChange={(e) =>
                    updateItem(i, { duration_minutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addItem}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        {t('add')}
      </button>
    </div>
  );
}
