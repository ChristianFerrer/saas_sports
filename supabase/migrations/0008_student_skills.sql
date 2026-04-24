-- Migration 008: Per-skill tracking for students
--
-- Replaces the synthesised "Mi progreso" bars on the parent / admin
-- student detail with real values. Skills are stored as a small fixed
-- set of text keys so the coach can rate a kid on 0..100 per
-- dimension (technique / physical / tactical / mental / social).
--
-- No schema for history yet — each (student, skill) is a single row
-- that gets overwritten on update. If snapshots-over-time are needed
-- later, add a student_skill_snapshots table keyed by (student, skill,
-- captured_at) — out of scope for now.
--
-- Apply after 0007_player_fields_and_group_order.sql.

create table if not exists public.student_skills (
  student_id uuid not null references public.students(id) on delete cascade,
  skill text not null,
  value smallint not null check (value between 0 and 100),
  notes text,
  updated_by uuid references public.profiles(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (student_id, skill)
);

create index if not exists student_skills_student_idx
  on public.student_skills(student_id);

drop trigger if exists student_skills_set_updated_at on public.student_skills;
create trigger student_skills_set_updated_at
  before update on public.student_skills
  for each row execute function public.set_updated_at();

alter table public.student_skills enable row level security;

drop policy if exists student_skills_admin_all on public.student_skills;
drop policy if exists student_skills_coach_rw on public.student_skills;
drop policy if exists student_skills_parent_read on public.student_skills;

create policy student_skills_admin_all
  on public.student_skills for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_skills.student_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_skills.student_id)
  );

create policy student_skills_coach_rw
  on public.student_skills for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_skills.student_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_skills.student_id)
  );

create policy student_skills_parent_read
  on public.student_skills for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.is_parent_of_student(student_skills.student_id)
  );
