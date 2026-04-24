import { describe, expect, it } from 'vitest';

import { parseSchedule } from './schedule';

describe('parseSchedule', () => {
  it('returns empty array for null/empty input', () => {
    expect(parseSchedule(null)).toEqual([]);
    expect(parseSchedule('')).toEqual([]);
  });

  it('parses a valid single entry', () => {
    const out = parseSchedule(
      JSON.stringify([{ weekday: 1, start_time: '17:00', duration_minutes: 60 }])
    );
    expect(out).toEqual([
      { weekday: 1, start_time: '17:00', duration_minutes: 60 }
    ]);
  });

  it('parses multiple valid entries preserving order', () => {
    const out = parseSchedule(
      JSON.stringify([
        { weekday: 1, start_time: '17:00', duration_minutes: 60 },
        { weekday: 3, start_time: '18:30', duration_minutes: 90 }
      ])
    );
    expect(out).toHaveLength(2);
    expect(out?.[0].weekday).toBe(1);
    expect(out?.[1].duration_minutes).toBe(90);
  });

  it('rejects non-JSON input', () => {
    expect(parseSchedule('not-json')).toBeNull();
  });

  it('rejects non-array JSON', () => {
    expect(parseSchedule('{"weekday":1}')).toBeNull();
  });

  it('rejects weekday out of 0..6', () => {
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 7, start_time: '17:00', duration_minutes: 60 }])
      )
    ).toBeNull();
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: -1, start_time: '17:00', duration_minutes: 60 }])
      )
    ).toBeNull();
  });

  it('rejects non-integer weekday', () => {
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1.5, start_time: '17:00', duration_minutes: 60 }])
      )
    ).toBeNull();
  });

  it('rejects malformed start_time', () => {
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1, start_time: '5:00', duration_minutes: 60 }])
      )
    ).toBeNull();
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1, start_time: '1700', duration_minutes: 60 }])
      )
    ).toBeNull();
  });

  it('rejects non-positive duration', () => {
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1, start_time: '17:00', duration_minutes: 0 }])
      )
    ).toBeNull();
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1, start_time: '17:00', duration_minutes: -5 }])
      )
    ).toBeNull();
  });

  it('rejects duration > 24h', () => {
    expect(
      parseSchedule(
        JSON.stringify([{ weekday: 1, start_time: '17:00', duration_minutes: 1441 }])
      )
    ).toBeNull();
  });

  it('rejects non-object array items', () => {
    expect(parseSchedule(JSON.stringify([null]))).toBeNull();
    expect(parseSchedule(JSON.stringify(['string']))).toBeNull();
  });
});
