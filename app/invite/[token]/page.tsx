import { getTranslations } from 'next-intl/server';

import { acceptInvitation } from '@/app/invite/[token]/actions';
import { AuthCard } from '@/components/auth/auth-card';
import { AcceptInvitationForm } from '@/components/auth/accept-invitation-form';
import { createUntypedServiceClient } from '@/lib/supabase/service';

type InvitationRow = {
  email: string;
  role: 'admin' | 'coach' | 'parent';
  full_name: string;
  expires_at: string;
  accepted_at: string | null;
  school_id: string;
};

export default async function AcceptInvitationPage({
  params
}: {
  params: { token: string };
}) {
  const t = await getTranslations();
  const admin = createUntypedServiceClient();

  const { data } = await admin
    .from('invitations')
    .select('email, role, full_name, expires_at, accepted_at, school_id')
    .eq('token', params.token)
    .maybeSingle();

  const inv = data as InvitationRow | null;

  if (!inv) return <Invalid reason={t('invite.errors.invalidToken')} />;
  if (inv.accepted_at) return <Invalid reason={t('invite.errors.alreadyAccepted')} />;
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return <Invalid reason={t('invite.errors.expired')} />;
  }

  const { data: schoolData } = await admin
    .from('schools')
    .select('name')
    .eq('id', inv.school_id)
    .maybeSingle();
  const schoolName = (schoolData as { name: string } | null)?.name ?? 'AI Sports';

  const boundAccept = acceptInvitation.bind(null, params.token);

  return (
    <AuthCard
      title={t('invite.title')}
      subtitle={t('invite.subtitle', {
        school: schoolName,
        role: t(`roles.${inv.role}`),
        email: inv.email
      })}
    >
      <AcceptInvitationForm action={boundAccept} />
    </AuthCard>
  );
}

function Invalid({ reason }: { reason: string }) {
  return (
    <AuthCard title="AI Sports" subtitle="">
      <p className="text-sm text-red-700">{reason}</p>
    </AuthCard>
  );
}
