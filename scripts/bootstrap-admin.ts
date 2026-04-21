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
  const schoolName = required('SCHOOL_NAME');
  const schoolTimezone = optional('SCHOOL_TIMEZONE', 'UTC');
  const appUrl = optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let user = await findUserByEmail(supabase, adminEmail);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      email_confirm: true,
      user_metadata: { full_name: adminFullName }
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created auth user ${user.id} (${adminEmail}).`);
  } else {
    console.log(`Auth user already exists: ${user.id} (${adminEmail}).`);
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

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
    options: { redirectTo: `${appUrl}/auth/callback` }
  });

  if (linkError) {
    console.warn(`Could not generate magic link: ${linkError.message}`);
    console.warn('Ask the admin to sign in at /login and request a link manually.');
  } else {
    const actionLink = linkData.properties?.action_link;
    console.log('\nBootstrap complete.');
    if (actionLink) {
      console.log(`\nOne-time sign-in link (expires shortly):\n  ${actionLink}`);
    } else {
      console.log('Magic link generated. Check the admin inbox or Supabase logs.');
    }
  }
}

main().catch((err) => {
  console.error('Bootstrap failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
