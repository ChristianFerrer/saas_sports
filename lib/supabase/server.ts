import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function cookieAdapter() {
  const cookieStore = cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Invoked from a Server Component. Middleware refreshes the session.
      }
    }
  };
}

export function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter() }
  );
}

// Untyped client for complex queries (specific column selects, inserts with
// relations, etc.) where Database-typed inference collapses to `never` with
// current @supabase/ssr + @supabase/supabase-js versions. Runtime is identical
// to createClient(); only TS types differ.
export function createUntypedClient(): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter() }
  );
}
