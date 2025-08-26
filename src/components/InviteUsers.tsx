'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { AlertTriangle } from 'lucide-react';
import { checkUserLimit, createInvitation } from '@/lib/actions/invitation-actions';

interface InviteUsersProps {
  userRole: UserRole;
  workspaceId?: string;
}

export default function InviteUsers({
  userRole,
  workspaceId,
}: InviteUsersProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [userLimit, setUserLimit] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);

  // Check user limit when component mounts or workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      checkUserLimit(workspaceId)
        .then(setUserLimit)
        .catch((error) => {
          console.error('Error checking user limit:', error);
        });
    }
  }, [workspaceId]);

  const canInvite =
    userRole === UserRole.SUPER_ADMIN || userRole === UserRole.BUSINESS_OWNER;

  const availableRoles = () => {
    if (userRole === UserRole.SUPER_ADMIN) {
      return [
        { value: UserRole.BUSINESS_OWNER, label: 'Business Owner' },
        { value: UserRole.STAFF, label: 'Staff Member' },
        { value: UserRole.USER, label: 'Client' },
      ];
    } else if (userRole === UserRole.BUSINESS_OWNER) {
      return [
        { value: UserRole.STAFF, label: 'Staff Member' },
        { value: UserRole.USER, label: 'Client' },
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    // Check user limit before sending invitation
    if (userLimit && !userLimit.allowed) {
      setMessage({
        type: 'error',
        text: `User limit reached. You can only have ${userLimit.limit} users in this workspace.`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await createInvitation({
        email,
        role,
        workspaceId:
          role === UserRole.STAFF || role === UserRole.USER
            ? workspaceId
            : undefined,
      });

      setMessage({
        type: 'success',
        text: `Invitation sent to ${email}! They will receive an email with instructions to join.`,
      });
      setEmail('');
      setRole(UserRole.USER);

      // Refresh user limit after successful invitation
      if (workspaceId) {
        checkUserLimit(workspaceId)
          .then(setUserLimit)
          .catch(console.error);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send invitation',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canInvite) {
    return null;
  }

  return (
    <div>
      {/* User Limit Warning */}
      {userLimit && !userLimit.allowed && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                User limit reached ({userLimit.limit} users).
                <a
                  href="/pricing"
                  className="underline hover:no-underline ml-1"
                >
                  Upgrade plan
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Usage Info */}
      {userLimit && userLimit.allowed && userLimit.limit !== -1 && (
        <div className="mb-3 text-xs text-gray-600">
          {userLimit.current}/{userLimit.limit} users
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={userLimit ? !userLimit.allowed : false}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Email address"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableRoles().map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={
              loading || !email || (userLimit ? !userLimit.allowed : false)
            }
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>

        {message && (
          <div
            className={`p-2 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
