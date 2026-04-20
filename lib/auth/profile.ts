import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
import type { Tables, UserRole } from '@/types/database';

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Tables<'profiles'> | null;
};

// Cached per-request. Safe to call from multiple server components.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? null
  };
});

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'coach':
      return '/coach';
    case 'parent':
      return '/parent';
  }
}
