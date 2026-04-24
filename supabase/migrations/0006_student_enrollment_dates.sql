-- Migration 006: Student enrollment window
--
-- Two optional DATE columns on students so the admin can record when a
-- kid joined the school (enrolled_at) and, when applicable, when they
-- left (left_at). The UI uses this window to scope attendance stats:
-- sessions outside [enrolled_at, left_at] don't count toward the
-- student's percentage.
--
-- No RLS changes — existing students_admin_all / students_coach_read /
-- students_parent_read policies already cover the row.
--
-- Apply after 0005_school_contact_info.sql.

alter table public.students
  add column if not exists enrolled_at date;

alter table public.students
  add column if not exists left_at date;
