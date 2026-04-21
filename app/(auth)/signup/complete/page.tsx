import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AuthCard } from '@/components/auth/auth-card';
import { getCurrentUser } from '@/lib/auth/profile';

import { CompleteSignupForm } from './form';

export default async function CompleteSignupPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.profile) redirect('/');

  const t = await getTranslations('auth.signup.complete');
  const defaultFullName =
    (user.email?.split('@')[0] ?? '').replace(/[._-]+/g, ' ') || 'Admin';

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      <CompleteSignupForm defaultFullName={defaultFullName} />
    </AuthCard>
  );
}
