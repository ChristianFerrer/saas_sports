-- Migration 003: Fix infinite recursion in RLS policies
--
-- The cross-table EXISTS() clauses in 0002 caused:
--   "infinite recursion detected in policy for relation <table>"
-- whenever a SELECT (including the RETURNING of an INSERT with .select())
-- touched groups/students/class_sessions/attendances — because each table's
-- policy triggered the other's, forming a cycle.
--
-- Fix: wrap every cross-table lookup in a SECURITY DEFINER helper that
-- bypasses RLS (the helper runs as its owner, so Postgres doesn't re-enter
-- the policy evaluation on the inner tables).
--
-- Apply this migration after 0002_rls_policies.sql.

-- ─── SECURITY DEFINER helpers ──────────────────────────────────────

create or replace function public.is_parent_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_parents sp
    where sp.student_id = p_student_id and sp.parent_user_id = auth.uid()
  )
$$;

create or replace function public.parent_has_student_in_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.student_parents sp on sp.student_id = s.id
    where s.group_id = p_group_id and sp.parent_user_id = auth.uid()
  )
$$;

create or replace function public.is_coach_of_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.coach_id = auth.uid()
  )
$$;

create or replace function public.is_coach_of_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_sessions cs
    join public.groups g on g.id = cs.group_id
    where cs.id = p_session_id and g.coach_id = auth.uid()
  )
$$;

create or replace function public.admin_owns_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id
      and s.school_id = public.current_user_school_id()
  )
$$;

create or replace function public.admin_owns_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id
      and g.school_id = public.current_user_school_id()
  )
$$;

create or replace function public.admin_owns_communication(p_comm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communications c
    where c.id = p_comm_id
      and c.school_id = public.current_user_school_id()
  )
$$;

create or replace function public.parent_is_recipient(p_comm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communication_recipients cr
    where cr.communication_id = p_comm_id and cr.parent_user_id = auth.uid()
  )
$$;

revoke all on function public.is_parent_of_student(uuid) from public;
revoke all on function public.parent_has_student_in_group(uuid) from public;
revoke all on function public.is_coach_of_group(uuid) from public;
revoke all on function public.is_coach_of_session(uuid) from public;
revoke all on function public.admin_owns_student(uuid) from public;
revoke all on function public.admin_owns_group(uuid) from public;
revoke all on function public.admin_owns_communication(uuid) from public;
revoke all on function public.parent_is_recipient(uuid) from public;

grant execute on function public.is_parent_of_student(uuid) to authenticated;
grant execute on function public.parent_has_student_in_group(uuid) to authenticated;
grant execute on function public.is_coach_of_group(uuid) to authenticated;
grant execute on function public.is_coach_of_session(uuid) to authenticated;
grant execute on function public.admin_owns_student(uuid) to authenticated;
grant execute on function public.admin_owns_group(uuid) to authenticated;
grant execute on function public.admin_owns_communication(uuid) to authenticated;
grant execute on function public.parent_is_recipient(uuid) to authenticated;

-- ─── groups: rewrite parent_read via helper ─────────────────────────

drop policy if exists groups_parent_read on public.groups;

create policy groups_parent_read
  on public.groups for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.parent_has_student_in_group(groups.id)
  );

-- ─── students: rewrite coach_read and parent_read via helpers ───────

drop policy if exists students_coach_read on public.students;
drop policy if exists students_parent_read on public.students;

create policy students_coach_read
  on public.students for select to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.is_coach_of_group(students.group_id)
  );

create policy students_parent_read
  on public.students for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.is_parent_of_student(students.id)
  );

-- ─── student_parents: rewrite admin_all via helper ──────────────────

drop policy if exists student_parents_admin_all on public.student_parents;

create policy student_parents_admin_all
  on public.student_parents for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_parents.student_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(student_parents.student_id)
  );

-- ─── class_sessions: rewrite admin_all, coach_rw, parent_read ───────

drop policy if exists class_sessions_admin_all on public.class_sessions;
drop policy if exists class_sessions_coach_rw on public.class_sessions;
drop policy if exists class_sessions_parent_read on public.class_sessions;

create policy class_sessions_admin_all
  on public.class_sessions for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_group(class_sessions.group_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_group(class_sessions.group_id)
  );

create policy class_sessions_coach_rw
  on public.class_sessions for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.is_coach_of_group(class_sessions.group_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.is_coach_of_group(class_sessions.group_id)
  );

create policy class_sessions_parent_read
  on public.class_sessions for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.parent_has_student_in_group(class_sessions.group_id)
  );

-- ─── attendances: rewrite all three policies ────────────────────────

drop policy if exists attendances_admin_all on public.attendances;
drop policy if exists attendances_coach_rw on public.attendances;
drop policy if exists attendances_parent_read on public.attendances;

create policy attendances_admin_all
  on public.attendances for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(attendances.student_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_student(attendances.student_id)
  );

create policy attendances_coach_rw
  on public.attendances for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and public.is_coach_of_session(attendances.session_id)
  )
  with check (
    public.current_user_role() = 'coach'
    and public.is_coach_of_session(attendances.session_id)
  );

create policy attendances_parent_read
  on public.attendances for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.is_parent_of_student(attendances.student_id)
  );

-- ─── communications / communication_recipients ─────────────────────

drop policy if exists communications_parent_read on public.communications;

create policy communications_parent_read
  on public.communications for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and public.parent_is_recipient(communications.id)
  );

drop policy if exists comm_recipients_admin_all on public.communication_recipients;

create policy comm_recipients_admin_all
  on public.communication_recipients for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and public.admin_owns_communication(communication_recipients.communication_id)
  )
  with check (
    public.current_user_role() = 'admin'
    and public.admin_owns_communication(communication_recipients.communication_id)
  );
