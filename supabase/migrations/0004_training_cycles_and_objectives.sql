-- Migration 004: Training cycles + curricular objectives
--
-- Adds start_date / end_date to groups so an admin can mark the boundaries
-- of a training cycle (e.g. September -> June). Days per week is derived
-- from the existing groups.schedule JSONB so no extra column is needed.
--
-- Introduces two new tables:
--
-- - objectives: per-group curricular goals (skill milestones like
--   "Chutar el balón", "Dribling", "Regate"). Each group has its own list.
-- - student_objectives: an achievement recorded for a given student on a
--   given objective, with an achieved_at timestamp and optional notes.
--
-- As kids move between groups with age, they accumulate achievements
-- across groups. The student detail page reads from this table to show
-- progress.
--
-- Apply after 0003_fix_rls_recursion.sql.

-- ─── groups: cycle dates ──────────────────────────────────────────

alter table public.groups add column if not exists start_date date;
alter table public.groups add column if not exists end_date date;

-- ─── objectives ────────────────────────────────────────────────────

create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists objectives_group_idx on public.objectives(group_id);

drop trigger if exists objectives_set_updated_at on public.objectives;
create trigger objectives_set_updated_at
  before update on public.objectives
  for each row execute function public.set_updated_at();

-- ─── student_objectives ────────────────────────────────────────────

create table if not exists public.student_objectives (
  student_id uuid not null references public.students(id) on delete cascade,
  objective_id uuid not null references public.objectives(id) on delete cascade,
  achieved_at timestamptz not null default now(),
  notes text,
  marked_by uuid references public.profiles(user_id) on delete set null,
  primary key (student_id, objective_id)
);
create index if not exists student_objectives_objective_idx
  on public.student_objectives(objective_id);

-- ─── RLS ──────────────────────────────────────────────────────────

alter table public.objectives enable row level security;
alter table public.student_objectives enable row level security;

-- Helpers (SECURITY DEFINER per §5 in CLAUDE.md — wrap every cross-table
-- EXISTS so policy evaluation never recurses).

create or replace function public.admin_owns_objective(p_objective_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.objectives o
    join public.groups g on g.id = o.group_id
    where o.id = p_objective_id
      and g.school_id = public.current_user_school_id()
  )
$$;

create or replace function public.coach_owns_objective(p_objective_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.objectives o
    join public.groups g on g.id = o.group_id
    where o.id = p_objective_id and g.coach_id = auth.uid()
  )
$$;

create or replace function public.coach_owns_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    join public.groups g on g.id = s.group_id
    where s.id = p_student_id and g.coach_id = auth.uid()
  )
$$;

revoke all on function public.admin_owns_objective(uuid) from public;
revoke all on function public.coach_owns_objective(uuid) from public;
revoke all on function public.coach_owns_student(uuid) from public;

grant execute on function public.admin_owns_objective(uuid) to authenticated;
grant execute on function public.coach_owns_objective(uuid) to authenticated;
grant execute on function public.coach_owns_student(uuid) to authenticated;

-- ─── objectives policies ──────────────────────────────────────────

drop policy if exists objectives_admin_all on public.objectives;
drop policy if exists objectives_coach_rw on public.objectives;
drop policy if exists objectives_parent_read on public.objectives;

create policy objectives_admin_all
  on public.objectives for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_group(objectives.group_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_group(objectives.group_id)
  );

create policy objectives_coach_rw
  on public.objectives for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.is_coach_of_group(objectives.group_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.is_coach_of_group(objectives.group_id)
  );

create policy objectives_parent_read
  on public.objectives for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.parent_has_student_in_group(objectives.group_id)
  );

-- ─── student_objectives policies ──────────────────────────────────

drop policy if exists student_objectives_admin_all on public.student_objectives;
drop policy if exists student_objectives_coach_rw on public.student_objectives;
drop policy if exists student_objectives_parent_read on public.student_objectives;

create policy student_objectives_admin_all
  on public.student_objectives for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_objectives.student_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_objectives.student_id)
  );

create policy student_objectives_coach_rw
  on public.student_objectives for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_objectives.student_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.coach_owns_student(student_objectives.student_id)
  );

create policy student_objectives_parent_read
  on public.student_objectives for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.is_parent_of_student(student_objectives.student_id)
  );
