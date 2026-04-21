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

async function main() {
  const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const adminEmail = required('ADMIN_EMAIL');
  const adminFullName = optional('ADMIN_FULL_NAME', 'Admin');
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || null;
  const schoolName = required('SCHOOL_NAME');
  const schoolTimezone = optional('SCHOOL_TIMEZONE', 'UTC');
  const appUrl = optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

  if (adminPassword && adminPassword.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let user = await findUserByEmail(supabase, adminEmail);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword ?? undefined,
      email_confirm: true,
      user_metadata: { full_name: adminFullName }
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created auth user ${user.id} (${adminEmail}).`);
  } else {
    console.log(`Auth user already exists: ${user.id} (${adminEmail}).`);
    if (adminPassword) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: adminPassword
      });
      if (error) throw error;
      console.log('Password updated.');
    }
  }

  const { data: existingSchools, error: schoolLookupError } = await supabase
    .from('schools')
    .select('id')
    .eq('name', schoolName)
    .limit(1);
  if (schoolLookupError) throw schoolLookupError;

  let schoolId: string;
  if (existingSchools && existingSchools.length > 0) {
    schoolId = existingSchools[0].id;
    console.log(`School already exists: ${schoolId} (${schoolName}).`);
  } else {
    const { data, error } = await supabase
      .from('schools')
      .insert({ name: schoolName, timezone: schoolTimezone })
      .select('id')
      .single();
    if (error) throw error;
    schoolId = data.id;
    console.log(`Created school ${schoolId} (${schoolName}, tz=${schoolTimezone}).`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      school_id: schoolId,
      role: 'admin',
      full_name: adminFullName
    },
    { onConflict: 'user_id' }
  );
  if (profileError) throw profileError;
  console.log(`Admin profile linked to school ${schoolId}.`);

  console.log('\nBootstrap complete.');
  if (adminPassword) {
    console.log(`\nAdmin can sign in at ${appUrl}/login with:`);
    console.log(`  email:    ${adminEmail}`);
    console.log(`  password: (the one you set in ADMIN_PASSWORD)`);
  } else {
    console.log(
      `\nNo ADMIN_PASSWORD was provided. The admin must go to ${appUrl}/forgot-password`
    );
    console.log(`and set a password via the emailed reset link before signing in.`);
  }
}

main().catch((err) => {
  console.error('Bootstrap failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
