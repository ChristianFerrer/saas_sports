-- Migration 007: Player-card fields on students + display_order on groups
--
-- Replaces the hash-derived placeholders shown on the premium student
-- detail hero with real columns, and gives admins an explicit ordering
-- knob for the roadmap timeline (Sub 3 -> Sub 5 -> ... -> Futuro).
--
-- No RLS changes — the existing students_* and groups_* policies cover
-- the new columns.
--
-- Apply after 0006_student_enrollment_dates.sql.

-- ─── students: player-card fields ────────────────────────────────

alter table public.students
  add column if not exists dorsal_number smallint;

alter table public.students
  add column if not exists position text;

alter table public.students
  add column if not exists dominant_foot text
  check (dominant_foot in ('left', 'right', 'both') or dominant_foot is null);

alter table public.students
  add column if not exists height_cm smallint
  check (height_cm is null or (height_cm > 0 and height_cm < 260));

alter table public.students
  add column if not exists weight_kg numeric(5, 2)
  check (weight_kg is null or (weight_kg > 0 and weight_kg < 300));

-- photo_url already exists in migration 0001 — no change needed.

-- ─── groups: roadmap ordering ────────────────────────────────────

alter table public.groups
  add column if not exists display_order int not null default 0;

create index if not exists groups_school_order_idx
  on public.groups(school_id, display_order);
