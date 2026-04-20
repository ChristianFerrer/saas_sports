import { redirect } from 'next/navigation';

import { getCurrentUser, roleHomePath } from '@/lib/auth/profile';

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.profile) redirect('/login?error=no_profile');
  redirect(roleHomePath(user.profile.role));
}
