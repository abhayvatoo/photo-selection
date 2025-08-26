'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { getInvitationByToken, acceptInvitation } from '@/lib/invitations';

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: {
    name: string;
    email: string;
  };
  workspace?: {
    name: string;
    slug: string;
  };
}

export default function InvitePage() {
  const { token } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        setError('Invalid or expired invitation');
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!session?.user) {
      // Redirect to sign in with the invitation email
      signIn('email', {
        email: invitation?.email,
        callbackUrl: `/invite/${token}`,
      });
      return;
    }

    if (session.user.email !== invitation?.email) {
      setError('You must sign in with the invited email address');
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect based on role
        switch (data.user.role) {
          case 'BUSINESS_OWNER':
            router.push('/photographer');
            break;
          case 'STAFF':
            router.push(`/workspace/${data.workspace?.slug}`);
            break;
          case 'USER':
            router.push(`/workspace/${data.workspace?.slug}`);
            break;
          default:
            router.push('/');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
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
