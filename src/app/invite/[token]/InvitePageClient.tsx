'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  invitedBy: {
    name: string | null;
    email: string;
  };
  workspace?: {
    name: string;
    slug: string;
  } | null;
}

interface InvitePageClientProps {
  invitation: Invitation | null;
  session: Session | null;
  acceptInvitationAction: () => Promise<void>;
}

export default function InvitePageClient({
  invitation,
  session,
  acceptInvitationAction,
}: InvitePageClientProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!session?.user) {
      // Redirect to sign in with the invitation email
      signIn('email', {
        email: invitation?.email,
        callbackUrl: window.location.href,
      });
      return;
    }

    if (session.user.email !== invitation?.email) {
      setError('You must sign in with the invited email address');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      await acceptInvitationAction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      );
      setAccepting(false);
    }
  };

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">
            This invitation is invalid or has expired
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'BUSINESS_OWNER':
        return 'Business Owner';
      case 'STAFF':
        return 'Staff Member';
      case 'USER':
        return 'Client';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-blue-500 text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-gray-600">
            {invitation.invitedBy.name || invitation.invitedBy.email} has
            invited you to join
            {invitation.workspace && ` ${invitation.workspace.name}`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium">
                {getRoleDisplayName(invitation.role)}
              </span>
            </div>
            {invitation.workspace && (
              <div className="flex justify-between">
                <span className="text-gray-600">Workspace:</span>
                <span className="font-medium">{invitation.workspace.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Expires:</span>
              <span className="font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!session?.user ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Sign in with your email to accept this invitation
            </p>
            <button
              onClick={handleAccept}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign In & Accept Invitation
            </button>
          </div>
        ) : session.user.email !== invitation.email ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">
              You&apos;re signed in as {session.user.email}, but this invitation
              is for {invitation.email}
            </p>
            <button
              onClick={() => signIn('email', { email: invitation.email })}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign In with {invitation.email}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to accept your invitation as{' '}
              {getRoleDisplayName(invitation.role)}?
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
