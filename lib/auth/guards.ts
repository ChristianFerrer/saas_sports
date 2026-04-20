import { redirect } from 'next/navigation';

import { getCurrentUser, type CurrentUser } from './profile';
import type { Tables, UserRole } from '@/types/database';

type AuthenticatedUser = CurrentUser & { profile: Tables<'profiles'> };

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.profile) redirect('/login?error=no_profile');
  return user as AuthenticatedUser;
}

export async function requireRole(role: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.profile.role !== role) redirect('/');
  return user;
}
