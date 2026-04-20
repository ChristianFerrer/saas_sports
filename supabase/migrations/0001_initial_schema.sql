-- Migration 001: Core schema for AI Sports V1
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'coach', 'parent');
create type public.session_status as enum ('scheduled', 'held', 'cancelled');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger schools_set_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  role public.user_role not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_school_id_idx on public.profiles(school_id);
create index profiles_role_idx on public.profiles(role);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  coach_id uuid references public.profiles(user_id) on delete set null,
  name text not null,
  schedule jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index groups_school_id_idx on public.groups(school_id);
create index groups_coach_id_idx on public.groups(coach_id);
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

comment on column public.groups.schedule is
  'Array of recurring weekly slots: [{ "weekday": 0-6, "start_time": "HH:MM", "duration_minutes": int }]. Weekday: 0=Sunday..6=Saturday.';

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  full_name text not null,
  birth_date date,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_school_id_idx on public.students(school_id);
create index students_group_id_idx on public.students(group_id);
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create table public.student_parents (
  student_id uuid not null references public.students(id) on delete cascade,
  parent_user_id uuid not null references public.profiles(user_id) on delete cascade,
  relationship text,
  created_at timestamptz not null default now(),
  primary key (student_id, parent_user_id)
);
create index student_parents_parent_idx on public.student_parents(parent_user_id);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  status public.session_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, scheduled_at)
);
create index class_sessions_group_idx on public.class_sessions(group_id);
create index class_sessions_scheduled_at_idx on public.class_sessions(scheduled_at);
create trigger class_sessions_set_updated_at
  before update on public.class_sessions
  for each row execute function public.set_updated_at();

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  present boolean not null,
  coach_notes text,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index attendances_session_idx on public.attendances(session_id);
create index attendances_student_idx on public.attendances(student_id);
create trigger attendances_set_updated_at
  before update on public.attendances
  for each row execute function public.set_updated_at();

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  subject text not null,
  content text not null,
  sent_by uuid not null references public.profiles(user_id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index communications_school_idx on public.communications(school_id);
create index communications_group_idx on public.communications(group_id);

create table public.communication_recipients (
  communication_id uuid not null references public.communications(id) on delete cascade,
  parent_user_id uuid not null references public.profiles(user_id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (communication_id, parent_user_id)
);
create index comm_recipients_parent_idx on public.communication_recipients(parent_user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null,
  role public.user_role not null,
  full_name text not null,
  student_id uuid references public.students(id) on delete set null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index invitations_email_idx on public.invitations(lower(email));
create index invitations_school_idx on public.invitations(school_id);

comment on column public.invitations.student_id is
  'When inviting a parent, references the student to link in student_parents on accept.';
