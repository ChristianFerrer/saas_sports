-- Migration 005: School contact info + communications responsible
--
-- Lets the admin fill in the school's public contact info (phone, email)
-- and optionally designate a profile (admin or coach of the same school)
-- as "responsable de comunicaciones".
--
-- No new RLS policies needed: schools is already covered by
-- schools_update_admin from 0002.
--
-- Apply after 0004_training_cycles_and_objectives.sql.

alter table public.schools
  add column if not exists contact_phone text;

alter table public.schools
  add column if not exists contact_email text;

alter table public.schools
  add column if not exists comms_responsible uuid
  references public.profiles(user_id) on delete set null;

create index if not exists schools_comms_responsible_idx
  on public.schools(comms_responsible);
