-- Migration 002: Row Level Security policies
-- Enforces per-tenant isolation and role-based access.

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.student_parents enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendances enable row level security;
alter table public.communications enable row level security;
alter table public.communication_recipients enable row level security;
alter table public.invitations enable row level security;

-- SECURITY DEFINER helpers avoid RLS recursion when policies query profiles.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_user_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where user_id = auth.uid()
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_school_id() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_school_id() to authenticated;

-- ─── schools ────────────────────────────────────────────────
create policy schools_select_own
  on public.schools for select to authenticated
  using (id = public.current_user_school_id());

create policy schools_update_admin
  on public.schools for update to authenticated
  using (id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (id = public.current_user_school_id() and public.current_user_role() = 'admin');

-- ─── profiles ───────────────────────────────────────────────
create policy profiles_select_self
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

create policy profiles_select_same_school
  on public.profiles for select to authenticated
  using (school_id = public.current_user_school_id());

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and school_id = public.current_user_school_id());

create policy profiles_admin_write
  on public.profiles for all to authenticated
  using (school_id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_user_school_id() and public.current_user_role() = 'admin');

-- ─── groups ─────────────────────────────────────────────────
create policy groups_admin_all
  on public.groups for all to authenticated
  using (school_id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_user_school_id() and public.current_user_role() = 'admin');

create policy groups_coach_read
  on public.groups for select to authenticated
  using (public.current_user_role() = 'coach' and coach_id = auth.uid());

create policy groups_parent_read
  on public.groups for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1
      from public.students s
      join public.student_parents sp on sp.student_id = s.id
      where s.group_id = groups.id and sp.parent_user_id = auth.uid()
    )
  );

-- ─── students ───────────────────────────────────────────────
create policy students_admin_all
  on public.students for all to authenticated
  using (school_id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_user_school_id() and public.current_user_role() = 'admin');

create policy students_coach_read
  on public.students for select to authenticated
  using (
    public.current_user_role() = 'coach'
    and exists (
      select 1 from public.groups g
      where g.id = students.group_id and g.coach_id = auth.uid()
    )
  );

create policy students_parent_read
  on public.students for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1 from public.student_parents sp
      where sp.student_id = students.id and sp.parent_user_id = auth.uid()
    )
  );

-- ─── student_parents ────────────────────────────────────────
create policy student_parents_admin_all
  on public.student_parents for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.students s
      where s.id = student_parents.student_id
        and s.school_id = public.current_user_school_id()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.students s
      where s.id = student_parents.student_id
        and s.school_id = public.current_user_school_id()
    )
  );

create policy student_parents_self_read
  on public.student_parents for select to authenticated
  using (parent_user_id = auth.uid());

-- ─── class_sessions ─────────────────────────────────────────
create policy class_sessions_admin_all
  on public.class_sessions for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.groups g
      where g.id = class_sessions.group_id
        and g.school_id = public.current_user_school_id()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.groups g
      where g.id = class_sessions.group_id
        and g.school_id = public.current_user_school_id()
    )
  );

create policy class_sessions_coach_rw
  on public.class_sessions for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and exists (
      select 1 from public.groups g
      where g.id = class_sessions.group_id and g.coach_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'coach'
    and exists (
      select 1 from public.groups g
      where g.id = class_sessions.group_id and g.coach_id = auth.uid()
    )
  );

create policy class_sessions_parent_read
  on public.class_sessions for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1
      from public.students s
      join public.student_parents sp on sp.student_id = s.id
      where s.group_id = class_sessions.group_id and sp.parent_user_id = auth.uid()
    )
  );

-- ─── attendances ────────────────────────────────────────────
create policy attendances_admin_all
  on public.attendances for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.students s
      where s.id = attendances.student_id
        and s.school_id = public.current_user_school_id()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.students s
      where s.id = attendances.student_id
        and s.school_id = public.current_user_school_id()
    )
  );

create policy attendances_coach_rw
  on public.attendances for all to authenticated
  using (
    public.current_user_role() = 'coach'
    and exists (
      select 1
      from public.class_sessions cs
      join public.groups g on g.id = cs.group_id
      where cs.id = attendances.session_id and g.coach_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'coach'
    and exists (
      select 1
      from public.class_sessions cs
      join public.groups g on g.id = cs.group_id
      where cs.id = attendances.session_id and g.coach_id = auth.uid()
    )
  );

create policy attendances_parent_read
  on public.attendances for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1 from public.student_parents sp
      where sp.student_id = attendances.student_id and sp.parent_user_id = auth.uid()
    )
  );

-- ─── communications ─────────────────────────────────────────
create policy communications_admin_all
  on public.communications for all to authenticated
  using (school_id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_user_school_id() and public.current_user_role() = 'admin');

create policy communications_parent_read
  on public.communications for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1 from public.communication_recipients cr
      where cr.communication_id = communications.id and cr.parent_user_id = auth.uid()
    )
  );

-- ─── communication_recipients ───────────────────────────────
create policy comm_recipients_admin_all
  on public.communication_recipients for all to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.communications c
      where c.id = communication_recipients.communication_id
        and c.school_id = public.current_user_school_id()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.communications c
      where c.id = communication_recipients.communication_id
        and c.school_id = public.current_user_school_id()
    )
  );

create policy comm_recipients_parent_rw
  on public.communication_recipients for all to authenticated
  using (parent_user_id = auth.uid())
  with check (parent_user_id = auth.uid());

-- ─── invitations ────────────────────────────────────────────
create policy invitations_admin_all
  on public.invitations for all to authenticated
  using (school_id = public.current_user_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_user_school_id() and public.current_user_role() = 'admin');
