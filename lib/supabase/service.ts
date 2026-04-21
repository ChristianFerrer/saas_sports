import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from '@supabase/supabase-js';

import type { Database } from '@/types/database';

// Service-role client: bypasses RLS. Server-only. Use for bootstrapping
// profiles on invitation acceptance and for admin-only server actions.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );
}

// Untyped variant for inserts/upserts where Database-typed inference
// collapses to `never` with the current @supabase/supabase-js version.
// Runtime identical to createServiceClient().
export function createUntypedServiceClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );
}
