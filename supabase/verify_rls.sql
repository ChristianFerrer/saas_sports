-- RLS verification queries.
-- Run these from SQL Editor as different authenticated users to confirm
-- policies behave as expected. Use the "Run as user" feature in the editor
-- (bottom right) to impersonate each role.
--
-- Expected results are annotated next to each query.

-- 1) As ANY authenticated user: can only see own school.
select id, name from public.schools;
-- expect: exactly 1 row (your school)

-- 2) As ADMIN: can see all profiles in own school.
select user_id, role, full_name from public.profiles;
-- expect: all admins/coaches/parents of the admin's school

-- 3) As COACH: can only see own profile + assigned groups' students.
select id, full_name, group_id from public.students;
-- expect: only students in groups where coach_id = auth.uid()

-- 4) As PARENT: can only see own children.
select id, full_name from public.students;
-- expect: only students linked via student_parents

-- 5) As PARENT: cannot see other parents in the school.
select user_id, full_name from public.profiles where role = 'parent';
-- expect: only own profile (not other parents)

-- 6) As COACH: cannot insert attendance for a session in another coach's group.
--    (Replace <OTHER_SESSION_ID> with a session from a group you are NOT assigned to.)
-- insert into public.attendances (session_id, student_id, present, created_by)
-- values ('<OTHER_SESSION_ID>', '<STUDENT_ID>', true, auth.uid());
-- expect: new row violates row-level security policy

-- 7) Cross-tenant isolation: no school should ever see another school's data.
--    Run as an admin of School A and check no School B rows leak.
select distinct school_id from public.profiles;
-- expect: exactly 1 school_id (the caller's)

-- 8) Helper functions return expected values.
select public.current_user_role(), public.current_user_school_id();
-- expect: non-null role + school_id matching the caller's profile
