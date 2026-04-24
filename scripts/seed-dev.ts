import 'dotenv/config';

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) return null;

    page += 1;
  }
}

async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string
): Promise<User> {
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    return existing;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });
  if (error) throw error;
  return data.user;
}

async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  schoolId: string,
  role: 'admin' | 'coach' | 'parent',
  fullName: string
) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, school_id: schoolId, role, full_name: fullName },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

async function ensureSchool(
  supabase: SupabaseClient,
  name: string,
  timezone: string
): Promise<string> {
  const { data: existing, error: lookupErr } = await supabase
    .from('schools')
    .select('id')
    .eq('name', name)
    .limit(1);
  if (lookupErr) throw lookupErr;

  if (existing && existing.length > 0) return existing[0].id;

  const { data, error } = await supabase
    .from('schools')
    .insert({ name, timezone })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureGroup(
  supabase: SupabaseClient,
  schoolId: string,
  name: string,
  coachId: string | null
): Promise<string> {
  const { data: existing, error: lookupErr } = await supabase
    .from('groups')
    .select('id')
    .eq('school_id', schoolId)
    .eq('name', name)
    .limit(1);
  if (lookupErr) throw lookupErr;

  if (existing && existing.length > 0) {
    const id = existing[0].id;
    if (coachId) {
      const { error: updErr } = await supabase
        .from('groups')
        .update({ coach_id: coachId })
        .eq('id', id);
      if (updErr) throw updErr;
    }
    return id;
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ school_id: schoolId, name, coach_id: coachId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureStudent(
  supabase: SupabaseClient,
  schoolId: string,
  groupId: string,
  fullName: string
): Promise<string> {
  const { data: existing, error: lookupErr } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('full_name', fullName)
    .limit(1);
  if (lookupErr) throw lookupErr;

  if (existing && existing.length > 0) {
    const id = existing[0].id;
    const { error: updErr } = await supabase
      .from('students')
      .update({ group_id: groupId })
      .eq('id', id);
    if (updErr) throw updErr;
    return id;
  }

  const { data, error } = await supabase
    .from('students')
    .insert({ school_id: schoolId, group_id: groupId, full_name: fullName })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureParentLink(
  supabase: SupabaseClient,
  studentId: string,
  parentUserId: string,
  relationship: string
) {
  const { error } = await supabase
    .from('student_parents')
    .upsert(
      { student_id: studentId, parent_user_id: parentUserId, relationship },
      { onConflict: 'student_id,parent_user_id' }
    );
  if (error) throw error;
}

async function ensureSessionWithAttendance(
  supabase: SupabaseClient,
  groupId: string,
  scheduledAt: string,
  studentIds: string[],
  createdBy: string
) {
  const { data: existing, error: lookupErr } = await supabase
    .from('class_sessions')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('scheduled_at', scheduledAt)
    .limit(1);
  if (lookupErr) throw lookupErr;

  let sessionId: string;
  if (existing && existing.length > 0) {
    sessionId = existing[0].id;
  } else {
    const { data, error } = await supabase
      .from('class_sessions')
      .insert({
        group_id: groupId,
        scheduled_at: scheduledAt,
        duration_minutes: 60,
        status: 'held'
      })
      .select('id')
      .single();
    if (error) throw error;
    sessionId = data.id;
  }

  if (studentIds.length === 0) return;

  const rows = studentIds.map((studentId, i) => ({
    session_id: sessionId,
    student_id: studentId,
    present: i % 4 !== 0, // ~75% attendance
    coach_notes: i % 4 === 0 ? 'Avisó que no podía asistir.' : null,
    created_by: createdBy
  }));

  const { error: upsertErr } = await supabase
    .from('attendances')
    .upsert(rows, { onConflict: 'session_id,student_id' });
  if (upsertErr) throw upsertErr;

  const { error: statusErr } = await supabase
    .from('class_sessions')
    .update({ status: 'held' })
    .eq('id', sessionId);
  if (statusErr) throw statusErr;
}

function daysAgoIso(days: number, hour = 17, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main() {
  const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const schoolName = optional('SEED_SCHOOL_NAME', 'SmartSpots Demo');
  const schoolTimezone = optional('SEED_SCHOOL_TIMEZONE', 'Europe/Madrid');
  const password = optional('SEED_DEFAULT_PASSWORD', 'password123');
  const adminEmail = optional('SEED_ADMIN_EMAIL', 'admin@demo.local');
  const appUrl = optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log(`Seeding school "${schoolName}" (tz=${schoolTimezone})...`);
  const schoolId = await ensureSchool(supabase, schoolName, schoolTimezone);

  const admin = await ensureAuthUser(supabase, adminEmail, password, 'Admin Demo');
  await ensureProfile(supabase, admin.id, schoolId, 'admin', 'Admin Demo');
  console.log(`  admin: ${adminEmail}`);

  const coaches = [
    { email: 'coach1@demo.local', name: 'Coach Uno' },
    { email: 'coach2@demo.local', name: 'Coach Dos' }
  ];
  const coachUsers: User[] = [];
  for (const c of coaches) {
    const u = await ensureAuthUser(supabase, c.email, password, c.name);
    await ensureProfile(supabase, u.id, schoolId, 'coach', c.name);
    coachUsers.push(u);
    console.log(`  coach: ${c.email}`);
  }

  const parents = [
    { email: 'parent1@demo.local', name: 'Padre Uno' },
    { email: 'parent2@demo.local', name: 'Madre Dos' },
    { email: 'parent3@demo.local', name: 'Padre Tres' }
  ];
  const parentUsers: User[] = [];
  for (const p of parents) {
    const u = await ensureAuthUser(supabase, p.email, password, p.name);
    await ensureProfile(supabase, u.id, schoolId, 'parent', p.name);
    parentUsers.push(u);
    console.log(`  parent: ${p.email}`);
  }

  const groupsDef = [
    { name: 'Benjamines A', coach: coachUsers[0].id },
    { name: 'Alevines A', coach: coachUsers[1].id },
    { name: 'Cadetes A', coach: null }
  ];
  const groupIds: string[] = [];
  for (const g of groupsDef) {
    const id = await ensureGroup(supabase, schoolId, g.name, g.coach);
    groupIds.push(id);
    console.log(`  group: ${g.name}`);
  }

  const studentNames = [
    ['Lucas Pérez', 'Noa García', 'Mateo Ruiz', 'Lola Torres', 'Hugo Navas'],
    ['Aitor Díaz', 'Emma Serra', 'Leo Vidal', 'Valeria Soto', 'Pablo Cano'],
    ['Martín Rojo', 'Alba Rivera', 'Iker Lago', 'Daniela Puig', 'Bruno Ferrer']
  ];
  const studentIdsByGroup: string[][] = [[], [], []];
  for (let g = 0; g < groupsDef.length; g += 1) {
    for (const name of studentNames[g]) {
      const id = await ensureStudent(supabase, schoolId, groupIds[g], name);
      studentIdsByGroup[g].push(id);
    }
  }
  console.log(`  students: ${studentIdsByGroup.flat().length} total`);

  // Parent-student links: parent1 → student 0 (Benjamines) + student 5 (Alevines);
  // parent2 → student 1; parent3 → student 10 (Cadetes).
  await ensureParentLink(supabase, studentIdsByGroup[0][0], parentUsers[0].id, 'padre');
  await ensureParentLink(supabase, studentIdsByGroup[1][0], parentUsers[0].id, 'padre');
  await ensureParentLink(supabase, studentIdsByGroup[0][1], parentUsers[1].id, 'madre');
  await ensureParentLink(supabase, studentIdsByGroup[2][0], parentUsers[2].id, 'padre');
  console.log('  parent-student links: 4');

  // 5 past sessions per group, spread across the last 14 days.
  const daysSchedule = [12, 10, 7, 5, 2];
  for (let g = 0; g < groupsDef.length; g += 1) {
    for (const daysAgo of daysSchedule) {
      const scheduledAt = daysAgoIso(daysAgo, 17 + g, 0);
      await ensureSessionWithAttendance(
        supabase,
        groupIds[g],
        scheduledAt,
        studentIdsByGroup[g],
        admin.id
      );
    }
  }
  console.log(`  sessions: ${groupsDef.length * daysSchedule.length} with attendance`);

  console.log('\nDone. Sign-in URLs (all with password "' + password + '"):');
  console.log(`  ${appUrl}/login`);
  console.log(`    admin:   ${adminEmail}`);
  for (const c of coaches) console.log(`    coach:   ${c.email}`);
  for (const p of parents) console.log(`    parent:  ${p.email}`);
}

main().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
