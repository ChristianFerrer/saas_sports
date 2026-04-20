-- Bootstrap the first school and its admin.
-- Run AFTER migrations 0001 and 0002.
--
-- Steps:
--   1. In Supabase dashboard → Authentication → Users → "Add user" → Send invite,
--      use the admin's email (e.g. admin@littlekickers.example). This creates
--      a row in auth.users. Copy the user UUID.
--   2. Replace <ADMIN_USER_ID> below with that UUID and run this script from
--      the SQL Editor.
--
-- Subsequent users (coaches, parents) are created via the in-app invitation
-- flow, so this script is only needed once per school.

do $$
declare
  v_school_id uuid;
  v_admin_user_id uuid := '<ADMIN_USER_ID>'::uuid;
begin
  insert into public.schools (name, timezone)
  values ('Little Kickers Barcelona', 'Europe/Madrid')
  returning id into v_school_id;

  insert into public.profiles (user_id, school_id, role, full_name)
  values (v_admin_user_id, v_school_id, 'admin', 'Little Kickers Admin');

  raise notice 'School created: %', v_school_id;
  raise notice 'Admin profile created for user: %', v_admin_user_id;
end;
$$;
