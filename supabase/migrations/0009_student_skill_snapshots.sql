-- Migration 009: Monthly snapshots of the coach's per-skill perception
--
-- student_skills carries the *current* rating, but the new student
-- detail's "Mi progreso" panel needs a monthly trend line. Each call
-- to saveStudentSkills() now also upserts a snapshot row keyed by
-- (student, captured_month, skill) so rating again in the same month
-- overwrites that month's value while older months stay frozen.
--
-- captured_month is normalised to the first day of the month so
-- queries like "last 10 months" can do a simple range filter.
--
-- Apply after 0008_student_skills.sql.

create table if not exists public.student_skill_snapshots (
  student_id uuid not null references public.students(id) on delete cascade,
  captured_month date not null,
  skill text not null,
  value smallint not null check (value between 0 and 100),
  captured_by uuid references public.profiles(user_id) on delete set null,
  captured_at timestamptz not null default now(),
  primary key (student_id, captured_month, skill)
);

create index if not exists student_skill_snapshots_student_month_idx
  on public.student_skill_snapshots(student_id, captured_month);

alter table public.student_skill_snapshots enable row level security;

drop policy if exists student_skill_snapshots_admin_all on public.student_skill_snapshots;
drop policy if exists student_skill_snapshots_coach_rw on public.student_skill_snapshots;
drop policy if exists student_skill_snapshots_parent_read on public.student_skill_snapshots;

create policy student_skill_snapshots_admin_all
  on public.student_skill_snapshots for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_skill_snapshots.student_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_skill_snapshots.student_id)
  );

create policy student_skill_snapshots_coach_rw
  on public.student_skill_snapshots for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_skill_snapshots.student_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_skill_snapshots.student_id)
  );

create policy student_skill_snapshots_parent_read
  on public.student_skill_snapshots for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.is_parent_of_student(student_skill_snapshots.student_id)
  );
