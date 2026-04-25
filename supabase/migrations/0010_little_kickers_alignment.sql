-- Migration 010: Little Kickers alignment
--
-- Adds the schema bits that let the student detail view speak the
-- Little Kickers language without changing any look & feel:
--
--   * groups.lk_level     — which LK programme this group belongs to
--                           (little_kicks / junior / mighty / mega).
--                           Optional; classic clubs leave it null.
--   * attendances.mood    — coach's 1-tap end-of-class read on the kid:
--                           0 = sad, 1 = neutral, 2 = happy. Optional.
--   * class_sessions.target_vocabulary — 3-5 English words worked in
--                           that session ("ball", "kick", "run"…).
--   * students.english_vocab_known     — words the kid recognises.
--   * students.english_vocab_used      — words the kid uses on her own.
--
-- The existing student_skills table keeps text keys, so the new five
-- LK skill keys (cognitive / physical / football / english / social)
-- and the soft-skill keys (independence / social_confidence /
-- follows_instructions) drop in without DDL. Historic rows for the
-- old keys (technique / tactical / mental) survive untouched but stop
-- being shown.
--
-- Apply after 0009_student_skill_snapshots.sql.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lk_level') then
    create type public.lk_level as enum (
      'little_kicks',
      'junior',
      'mighty',
      'mega'
    );
  end if;
end$$;

alter table public.groups
  add column if not exists lk_level public.lk_level;

alter table public.attendances
  add column if not exists mood smallint
    check (mood is null or mood between 0 and 2);

alter table public.class_sessions
  add column if not exists target_vocabulary text[]
    not null default '{}';

alter table public.students
  add column if not exists english_vocab_known text[]
    not null default '{}',
  add column if not exists english_vocab_used text[]
    not null default '{}';
