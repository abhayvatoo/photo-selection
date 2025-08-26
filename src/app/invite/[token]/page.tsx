import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getInvitationByToken, acceptInvitation } from '@/lib/invitations';
import InvitePageClient from './InvitePageClient';

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const session = await getServerSession(authOptions);
  const { token } = params;

  // Fetch invitation data on the server
  const invitation = await getInvitationByToken(token);

  // Server action for accepting invitation
  async function handleAcceptInvitation() {
    'use server';

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    if (!invitation) {
      throw new Error('Invalid invitation');
    }

    if (session.user.email !== invitation.email) {
      throw new Error('You must sign in with the invited email address');
    }

    const result = await acceptInvitation(token, session.user.id);

    // Redirect based on role
    switch (result.user.role) {
      case 'BUSINESS_OWNER':
        redirect('/photographer');
      case 'STAFF':
        redirect(`/workspace/${result.invitation.workspace?.slug}`);
      case 'USER':
        redirect(`/workspace/${result.invitation.workspace?.slug}`);
      default:
        redirect('/');
    }
  }

  return (
    <InvitePageClient
      invitation={invitation}
      session={session}
      acceptInvitationAction={handleAcceptInvitation}
    />
  );
}
